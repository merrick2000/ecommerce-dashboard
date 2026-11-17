/**
 * Import d'un produit depuis l'URL d'une page produit (Shopify, WooCommerce, sites génériques).
 *
 * Ordre de fiabilité : API produit Shopify (.js) → JSON-LD schema.org → microdonnées → OpenGraph/Twitter
 * → images de la page. Rien n'est inventé : on ne garde que ce qui est réellement présent.
 * Tout accès réseau passe par safeFetch (anti-SSRF, taille et durée bornées).
 */
import { sanitizeHtml } from '../lib/sanitize'
import { badRequest } from '../lib/errors'
import { safeFetch } from './remote'

export type ImportSource = 'shopify' | 'jsonld' | 'microdata' | 'opengraph' | 'page'

export interface ImportVariant {
  name: string
  price: number | null
  available: boolean
  sku: string | null
}

export interface ImportDraft {
  type: 'physical' | 'digital'
  name: string
  /** HTML nettoyé. */
  description: string
  price: number | null
  compareAtPrice: number | null
  /** Devise de la page source (ISO 4217) si connue. */
  currency: string | null
  variantLabel: string | null
  variants: ImportVariant[]
  /** URLs absolues des images (pas encore téléchargées). */
  images: string[]
  video: string | null
  features: string[]
  faqs: { question: string; answer: string }[]
  testimonials: { name: string; rating: number; text: string }[]
  brand: string | null
}

export interface UrlPreview {
  sourceUrl: string
  domain: string
  detected: ImportSource[]
  warnings: string[]
  draft: ImportDraft
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))

export const stripTags = (html: string) =>
  decodeEntities(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

const clean = (s: unknown, max = 500): string => (typeof s === 'string' ? decodeEntities(s).replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** « 29 900 », « 29.900,00 », « 1,299.99 », 29900 → nombre. */
export function parsePrice(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null
  if (typeof v !== 'string') return null
  let s = v.replace(/[^\d.,]/g, '')
  if (!s) return null
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot > -1 && lastComma > -1) {
    // Le dernier séparateur est le séparateur décimal.
    s = lastDot > lastComma ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.')
  } else if (lastComma > -1) {
    const decimals = s.length - lastComma - 1
    s = decimals === 3 && s.split(',').length > 1 ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (lastDot > -1) {
    const parts = s.split('.')
    if (parts.length > 2 || (parts[1]?.length === 3 && parts[0]!.length <= 3)) s = s.replace(/\./g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

const absolute = (u: string, base: string): string | null => {
  try {
    const url = new URL(u.trim().startsWith('//') ? `https:${u.trim()}` : u.trim(), base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Retire les paramètres de taille Shopify/CDN pour récupérer l'image en grand. */
const largeImage = (u: string) => u.replace(/_(\d+x\d*|\d*x\d+|small|medium|large|compact|thumb|grande)(@2x)?(?=\.(jpe?g|png|webp|gif))/i, '')

const asArray = <T>(v: T | T[] | null | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v])

const typeIs = (node: Record<string, unknown>, t: string) => asArray(node['@type'] as string | string[]).some((x) => String(x).toLowerCase() === t.toLowerCase())

/** Liens vidéo exploitables (YouTube, Vimeo, TikTok, Facebook) normalisés en URL de visionnage. */
export function normalizeVideo(raw: string): string | null {
  const u = raw.trim()
  const yt = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/i)
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d{6,})/i)
  if (vimeo) return `https://vimeo.com/${vimeo[1]}`
  if (/tiktok\.com\/.+\/video\/\d+/i.test(u)) return u.split('?')[0]!
  if (/facebook\.com\/.+\/videos\/\d+|fb\.watch\//i.test(u)) return u.split('?')[0]!
  return null
}

/** Points forts : éléments de la première liste à puces de la description. */
export function featuresFromHtml(html: string): string[] {
  const ul = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (!ul) return []
  return [...ul[1]!.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => clean(stripTags(m[1]!), 200))
    .filter((t) => t.length >= 3)
    .slice(0, 8)
}

// ─── Lecture de la page (HTMLRewriter de Bun, sans navigateur) ───────────────

interface PageScan {
  title: string
  meta: Map<string, string[]>
  jsonld: string[]
  /** Microdonnées : itemprop → valeurs (content ou href/src). */
  itemprops: Map<string, string[]>
  images: { src: string; width: number; height: number; alt: string }[]
  videos: string[]
  html: string
}

async function scanHtml(html: string, baseUrl: string): Promise<PageScan> {
  const scan: PageScan = { title: '', meta: new Map(), jsonld: [], itemprops: new Map(), images: [], videos: [], html }
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    if (!v) return
    const list = m.get(k) ?? []
    list.push(v)
    m.set(k, list)
  }
  let inTitle = false
  let ld: string | null = null
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        inTitle = true
        el.onEndTag(() => {
          inTitle = false
        })
      },
      text(t) {
        if (inTitle) scan.title += t.text
      },
    })
    .on('meta', {
      element(el) {
        const key = (el.getAttribute('property') ?? el.getAttribute('name') ?? el.getAttribute('itemprop') ?? '').toLowerCase()
        const content = el.getAttribute('content') ?? ''
        if (key) push(scan.meta, key, decodeEntities(content))
        const ip = el.getAttribute('itemprop')
        if (ip) push(scan.itemprops, ip, decodeEntities(content))
      },
    })
    .on('script[type="application/ld+json"]', {
      element(el) {
        ld = ''
        el.onEndTag(() => {
          if (ld !== null) scan.jsonld.push(ld)
          ld = null
        })
      },
      text(t) {
        if (ld !== null) ld += t.text
      },
    })
    .on('[itemprop]', {
      element(el) {
        if (el.tagName === 'meta') return
        const ip = el.getAttribute('itemprop')!
        const v = el.getAttribute('content') ?? el.getAttribute('src') ?? el.getAttribute('href') ?? ''
        if (v) push(scan.itemprops, ip, decodeEntities(v))
      },
    })
    .on('img', {
      element(el) {
        const srcset = el.getAttribute('data-srcset') ?? el.getAttribute('srcset') ?? ''
        const best = srcset
          .split(',')
          .map((s) => s.trim().split(/\s+/))
          .filter((p) => p[0])
          .sort((a, b) => parseInt(b[1] ?? '0') - parseInt(a[1] ?? '0'))[0]?.[0]
        const src = best ?? el.getAttribute('data-src') ?? el.getAttribute('data-original') ?? el.getAttribute('src') ?? ''
        const abs = src && !src.startsWith('data:') ? absolute(src, baseUrl) : null
        if (abs) scan.images.push({ src: abs, width: Number(el.getAttribute('width') ?? 0), height: Number(el.getAttribute('height') ?? 0), alt: el.getAttribute('alt') ?? '' })
      },
    })
    .on('iframe', {
      element(el) {
        const v = normalizeVideo(el.getAttribute('src') ?? el.getAttribute('data-src') ?? '')
        if (v) scan.videos.push(v)
      },
    })
    .on('a[href]', {
      element(el) {
        const v = normalizeVideo(el.getAttribute('href') ?? '')
        if (v) scan.videos.push(v)
      },
    })
  await rewriter.transform(new Response(html)).text()
  scan.title = decodeEntities(scan.title).trim()
  return scan
}

// ─── Shopify ─────────────────────────────────────────────────────────────────

interface ShopifyProduct {
  title?: string
  description?: string
  body_html?: string
  vendor?: string
  type?: string
  product_type?: string
  price?: number | string
  compare_at_price?: number | string | null
  options?: (string | { name: string })[]
  variants?: { title?: string; price?: number | string; compare_at_price?: number | string | null; available?: boolean; sku?: string | null }[]
  images?: (string | { src: string })[]
  media?: { media_type?: string; host?: string; external_id?: string }[]
}

const shopifyHandle = (url: URL) => url.pathname.match(/\/products\/([^/?#.]+)/)?.[1] ?? null

/** Shopify : `.js` renvoie les prix en centimes ; `.json` (product.body_html) en unités texte. */
function fromShopify(p: ShopifyProduct, fromJs: boolean, base: string): Partial<ImportDraft> {
  const money = (v: unknown) => {
    if (v == null || v === '') return null
    const n = typeof v === 'number' ? v : parsePrice(String(v))
    if (n == null) return null
    return fromJs ? Math.round(n) / 100 : n
  }
  const options = asArray(p.options).map((o) => (typeof o === 'string' ? o : o.name)).filter((o) => o && o.toLowerCase() !== 'title')
  const variants = asArray(p.variants)
    .filter((v) => v.title && v.title !== 'Default Title')
    .map((v) => ({ name: clean(v.title, 120), price: money(v.price), available: v.available !== false, sku: v.sku ? clean(v.sku, 60) : null }))
  const first = asArray(p.variants)[0]
  const description = p.description ?? p.body_html ?? ''
  const video = asArray(p.media)
    .map((m) => (m.media_type === 'external_video' && m.host === 'youtube' && m.external_id ? `https://www.youtube.com/watch?v=${m.external_id}` : m.media_type === 'external_video' && m.host === 'vimeo' && m.external_id ? `https://vimeo.com/${m.external_id}` : null))
    .find(Boolean)
  return {
    name: clean(p.title, 160),
    description,
    price: money(p.price ?? first?.price),
    compareAtPrice: money(p.compare_at_price ?? first?.compare_at_price),
    variantLabel: options.length ? options.join(' / ').slice(0, 40) : null,
    variants,
    images: asArray(p.images)
      .map((i) => absolute(typeof i === 'string' ? i : i.src, base))
      .filter((x): x is string => !!x)
      .map(largeImage),
    video: video ?? null,
    brand: p.vendor ? clean(p.vendor, 80) : null,
  }
}

async function tryShopify(url: URL, scan: PageScan | null): Promise<Partial<ImportDraft> | null> {
  const handle = shopifyHandle(url)
  if (!handle) return null
  const looksShopify = !scan || /cdn\.shopify\.com|Shopify\.shop|shopify-section/i.test(scan.html)
  if (!looksShopify) return null
  for (const [suffix, fromJs] of [['.js', true], ['.json', false]] as const) {
    try {
      const r = await safeFetch(`${url.origin}/products/${handle}${suffix}`, { maxBytes: 3 * 1024 * 1024, timeoutMs: 10_000, accept: 'application/json' })
      if (r.status !== 200) continue
      const data = JSON.parse(r.body.toString('utf8')) as ShopifyProduct | { product: ShopifyProduct }
      const product = 'product' in data && data.product ? data.product : (data as ShopifyProduct)
      if (!product.title) continue
      return fromShopify(product, fromJs, url.origin)
    } catch {
      /* page non Shopify ou JSON illisible : on passe à la méthode suivante */
    }
  }
  return null
}

// ─── JSON-LD schema.org ──────────────────────────────────────────────────────

type Node = Record<string, unknown>

function flattenLd(raw: string): Node[] {
  let data: unknown
  try {
    data = JSON.parse(raw.trim().replace(/^<!--|-->$/g, ''))
  } catch {
    return []
  }
  const out: Node[] = []
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      const n = v as Node
      out.push(n)
      if (n['@graph']) walk(n['@graph'])
    }
  }
  walk(data)
  return out
}

const ldImage = (v: unknown, base: string): string[] =>
  asArray(v as unknown[])
    .map((i) => (typeof i === 'string' ? i : i && typeof i === 'object' ? ((i as Node).url ?? (i as Node).contentUrl) : null))
    .map((s) => (typeof s === 'string' ? absolute(s, base) : null))
    .filter((x): x is string => !!x)

function ldOffer(offers: unknown): { price: number | null; currency: string | null; available: boolean } {
  const list = asArray(offers as Node | Node[]).filter((o) => o && typeof o === 'object')
  const o = list[0]
  if (!o) return { price: null, currency: null, available: true }
  const spec = asArray(o.priceSpecification as Node | Node[])[0]
  const price = parsePrice(o.price ?? o.lowPrice ?? spec?.price)
  const currency = clean(o.priceCurrency ?? spec?.priceCurrency, 3).toUpperCase() || null
  const availability = String(o.availability ?? '')
  return { price, currency, available: !/OutOfStock|SoldOut|Discontinued/i.test(availability) }
}

function fromJsonLd(nodes: Node[], base: string): { product: Partial<ImportDraft>; faqs: ImportDraft['faqs']; testimonials: ImportDraft['testimonials'] } | null {
  const product = nodes.find((n) => typeIs(n, 'Product') || typeIs(n, 'ProductGroup'))
  const faqPage = nodes.find((n) => typeIs(n, 'FAQPage'))
  const faqs = asArray(faqPage?.mainEntity as Node | Node[])
    .map((q) => ({ question: clean(q?.name, 300), answer: clean(stripTags(String((q?.acceptedAnswer as Node | undefined)?.text ?? '')), 3000) }))
    .filter((f) => f.question && f.answer)
    .slice(0, 10)
  if (!product) return faqs.length ? { product: {}, faqs, testimonials: [] } : null
  const offer = ldOffer(product.offers)
  const variantNodes = asArray(product.hasVariant as Node | Node[]).filter((v) => v && typeof v === 'object')
  const variants: ImportVariant[] = variantNodes.map((v) => {
    const o = ldOffer(v.offers)
    return { name: clean(v.name, 120), price: o.price, available: o.available, sku: v.sku ? clean(v.sku, 60) : null }
  })
  // Le nom des variantes reprend souvent le nom du produit : on ne garde que la partie distinctive.
  const baseName = clean(product.name, 160)
  for (const v of variants) if (baseName && v.name.startsWith(baseName)) v.name = v.name.slice(baseName.length).replace(/^[\s\-–:|/]+/, '').trim() || v.name
  const images = [...ldImage(product.image, base), ...variantNodes.flatMap((v) => ldImage(v.image, base))]
  const firstVariantOffer = variantNodes[0] ? ldOffer(variantNodes[0].offers) : null
  const videoNode = asArray(product.video as Node | Node[])[0]
  const video = videoNode ? normalizeVideo(String(videoNode.embedUrl ?? videoNode.contentUrl ?? videoNode.url ?? '')) : null
  const testimonials = asArray(product.review as Node | Node[])
    .map((r) => {
      const author = r?.author
      const name = clean(typeof author === 'string' ? author : (author as Node | undefined)?.name, 80)
      const rating = Math.round(Number((r?.reviewRating as Node | undefined)?.ratingValue ?? 5))
      return { name: name || 'Client', rating: Math.min(5, Math.max(1, Number.isFinite(rating) ? rating : 5)), text: clean(r?.reviewBody ?? r?.description, 1000) }
    })
    .filter((t) => t.text)
    .slice(0, 10)
  return {
    product: {
      name: baseName,
      description: typeof product.description === 'string' ? product.description : '',
      price: offer.price ?? firstVariantOffer?.price ?? null,
      currency: offer.currency ?? firstVariantOffer?.currency ?? null,
      variants,
      variantLabel: variants.length ? clean(asArray(product.variesBy as string[]).map((x) => String(x).split('/').pop()).join(' / '), 40) || null : null,
      images,
      video,
      brand: clean(typeof product.brand === 'string' ? product.brand : (product.brand as Node | undefined)?.name, 80) || null,
    },
    faqs,
    testimonials,
  }
}

// ─── Assemblage ──────────────────────────────────────────────────────────────

const IMAGE_NOISE = /logo|icon|sprite|avatar|badge|flag|payment|paypal|visa|mastercard|placeholder|loader|spinner|pixel|tracking|blank|emoji|star|rating|arrow|\.svg(\?|$)|\.gif(\?|$)/i

function pageImages(scan: PageScan): string[] {
  return scan.images
    .filter((i) => !IMAGE_NOISE.test(i.src) && !IMAGE_NOISE.test(i.alt))
    .filter((i) => (i.width === 0 || i.width >= 300) && (i.height === 0 || i.height >= 200))
    .map((i) => largeImage(i.src))
}

const dedupe = (list: string[]) => {
  const seen = new Set<string>()
  return list.filter((u) => {
    const key = u.replace(/[?#].*$/, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Analyse une page déjà téléchargée (testable sans réseau, sauf l'appel Shopify optionnel). */
export async function extractProduct(html: string, pageUrl: string, opts: { allowShopifyFetch?: boolean } = {}): Promise<Omit<UrlPreview, 'domain'>> {
  const url = new URL(pageUrl)
  const scan = await scanHtml(html, pageUrl)
  const detected: ImportSource[] = []
  const warnings: string[] = []
  const meta = (k: string) => scan.meta.get(k)?.[0]?.trim() || ''
  const metas = (k: string) => scan.meta.get(k) ?? []

  const shopify = opts.allowShopifyFetch === false ? null : await tryShopify(url, scan)
  if (shopify) detected.push('shopify')

  const ldNodes = scan.jsonld.flatMap(flattenLd)
  const ld = fromJsonLd(ldNodes, pageUrl)
  if (ld?.product.name) detected.push('jsonld')

  const ip = (k: string) => scan.itemprops.get(k)?.[0]?.trim() || ''
  const micro: Partial<ImportDraft> = ip('price')
    ? { price: parsePrice(ip('price')), currency: ip('priceCurrency').toUpperCase() || null, images: (scan.itemprops.get('image') ?? []).map((s) => absolute(s, pageUrl)).filter((x): x is string => !!x) }
    : {}
  if (micro.price != null) detected.push('microdata')

  const og: Partial<ImportDraft> = {
    name: clean(meta('og:title') || meta('twitter:title') || scan.title, 160),
    description: meta('og:description') || meta('description') || meta('twitter:description'),
    price: parsePrice(meta('product:price:amount') || meta('og:price:amount')),
    currency: (meta('product:price:currency') || meta('og:price:currency')).toUpperCase() || null,
    images: [...metas('og:image'), ...metas('og:image:secure_url'), ...metas('og:image:url'), ...metas('twitter:image')].map((s) => absolute(s, pageUrl)).filter((x): x is string => !!x),
    video: [...metas('og:video'), ...metas('og:video:url'), ...metas('og:video:secure_url')].map(normalizeVideo).find(Boolean) ?? null,
  }
  if (og.name) detected.push('opengraph')

  const pick = <K extends keyof ImportDraft>(k: K): ImportDraft[K] | undefined => {
    for (const src of [shopify, ld?.product, micro, og]) {
      const v = src?.[k]
      if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) return v as ImportDraft[K]
    }
    return undefined
  }

  // Images : sources structurées d'abord, puis les grandes images de la page en complément.
  let images = dedupe([...(shopify?.images ?? []), ...(ld?.product.images ?? []), ...(micro.images ?? []), ...(og.images ?? [])])
  if (images.length < 3) {
    const extra = pageImages(scan)
    if (extra.length) detected.push('page')
    images = dedupe([...images, ...extra])
  }
  images = images.slice(0, 20)

  const rawDescription = pick('description') ?? ''
  const descriptionHtml = /<[a-z][\s\S]*>/i.test(rawDescription) ? rawDescription : rawDescription.split(/\n{2,}/).map((p) => `<p>${p.replace(/</g, '&lt;')}</p>`).join('')
  const description = sanitizeHtml(descriptionHtml)

  const draft: ImportDraft = {
    type: 'physical',
    name: pick('name') ?? '',
    description,
    price: pick('price') ?? null,
    compareAtPrice: shopify?.compareAtPrice ?? null,
    currency: pick('currency') ?? null,
    variantLabel: pick('variantLabel') ?? null,
    variants: (pick('variants') ?? []).slice(0, 50),
    images,
    video: pick('video') ?? scan.videos[0] ?? null,
    features: featuresFromHtml(description),
    faqs: ld?.faqs ?? [],
    testimonials: ld?.testimonials ?? [],
    brand: pick('brand') ?? null,
  }
  if (draft.compareAtPrice != null && draft.price != null && draft.compareAtPrice <= draft.price) draft.compareAtPrice = null

  if (!draft.name) warnings.push('Nom du produit introuvable : à saisir.')
  if (draft.price == null) warnings.push('Prix introuvable : à saisir.')
  if (!images.length) warnings.push('Aucune image détectée.')
  if (!detected.some((d) => d !== 'opengraph' && d !== 'page')) warnings.push('Page peu structurée : vérifiez bien les informations détectées.')
  return { sourceUrl: pageUrl, detected, warnings, draft }
}

/** Télécharge la page (5 Mo, 15 s max) puis l'analyse. */
export async function previewFromUrl(rawUrl: string, storeCurrency: string): Promise<UrlPreview> {
  const page = await safeFetch(rawUrl, { maxBytes: 5 * 1024 * 1024, timeoutMs: 15_000 })
  const finalUrl = page.url
  let result: Omit<UrlPreview, 'domain'>
  if (/json/i.test(page.contentType)) {
    // Lien direct vers l'API Shopify (…/products/x.js ou .json).
    const data = JSON.parse(page.body.toString('utf8')) as ShopifyProduct | { product: ShopifyProduct }
    const product = 'product' in data && data.product ? data.product : (data as ShopifyProduct)
    const partial = fromShopify(product, finalUrl.endsWith('.js'), new URL(finalUrl).origin)
    result = {
      sourceUrl: finalUrl,
      detected: ['shopify'],
      warnings: [],
      draft: { type: 'physical', name: partial.name ?? '', description: sanitizeHtml(partial.description ?? ''), price: partial.price ?? null, compareAtPrice: partial.compareAtPrice ?? null, currency: null, variantLabel: partial.variantLabel ?? null, variants: partial.variants ?? [], images: partial.images ?? [], video: partial.video ?? null, features: featuresFromHtml(partial.description ?? ''), faqs: [], testimonials: [], brand: partial.brand ?? null },
    }
  } else {
    if (page.status >= 400) throw badRequest(`Le site a répondu avec une erreur (${page.status})`)
    result = await extractProduct(page.body.toString('utf8'), finalUrl)
  }
  if (result.draft.currency && result.draft.currency !== storeCurrency) {
    result.warnings.push(`Prix en ${result.draft.currency} sur le site source : votre boutique est en ${storeCurrency}. Ajustez le prix avant d’importer.`)
  }
  return { ...result, domain: new URL(finalUrl).hostname.replace(/^www\./, '') }
}
