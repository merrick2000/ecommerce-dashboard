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
import { aiAvailable } from './ai-suggest'
import { extractWithAi, type AiExtraction } from './ai-extract'
import { fetchDirect, fetchWithFirecrawl, firecrawlAvailable, looksBlocked, softBlocked, type FetchedPage, type FirecrawlProduct } from './page-fetch'

export type ImportSource = 'shopify' | 'jsonld' | 'microdata' | 'opengraph' | 'page' | 'ai' | 'browser'

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
  /** Comment la page a été lue : directement, via Firecrawl (navigateur + proxys), ou texte collé. */
  fetchedVia?: 'direct' | 'firecrawl' | 'text'
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
  // Produits physiques, mais aussi formations (Course), ebooks (Book), logiciels, documents : les fiches digitales.
  const product = nodes.find((n) => ['Product', 'ProductGroup', 'Course', 'Book', 'SoftwareApplication', 'DigitalDocument', 'CreativeWork'].some((t) => typeIs(n, t)))
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

const draftFromShopify = (p: Partial<ImportDraft>): ImportDraft => ({
  type: 'physical',
  name: p.name ?? '',
  description: sanitizeHtml(p.description ?? ''),
  price: p.price ?? null,
  compareAtPrice: p.compareAtPrice ?? null,
  currency: null,
  variantLabel: p.variantLabel ?? null,
  variants: p.variants ?? [],
  images: p.images ?? [],
  video: p.video ?? null,
  features: featuresFromHtml(p.description ?? ''),
  faqs: [],
  testimonials: [],
  brand: p.brand ?? null,
})

/** Nom sans le nom de la place de marché collé à la fin (« … - AliExpress 1511 », « … : Amazon.fr : Beauté »). */
export const cleanMarketplaceName = (name: string) =>
  name
    .replace(/\s*[-|:]\s*AliExpress(\s+\d+)?\s*$/i, '')
    .replace(/\s*:\s*Amazon\.[a-z.]+(\s*:.*)?$/i, '')
    .replace(/^Amazon\.[a-z.]+\s*:\s*/i, '')
    .replace(/\s*\|\s*Temu\s*.*$/i, '')
    .trim()

/** Fiche « product » de Firecrawl → brouillon (prix le plus bas des variantes, photos de toutes les variantes). */
export function draftFromFirecrawl(p: FirecrawlProduct): ImportDraft {
  const variants = (p.variants ?? []).filter((v) => v.price?.amount != null || v.title || v.values)
  const prices = variants.map((v) => v.price?.amount).filter((x): x is number => typeof x === 'number' && x > 0)
  const price = prices.length ? Math.min(...prices) : null
  const cheapest = variants.find((v) => v.price?.amount === price)
  const original = cheapest?.sale?.originalPrice
  const compareAt = typeof original === 'number' ? original : (original?.amount ?? null)
  const named = variants
    .map((v) => ({ name: clean(v.title || Object.values(v.values ?? {}).join(' / '), 80), price: v.price?.amount ?? null, available: v.availability?.inStock !== false, sku: v.sku ? clean(v.sku, 60) : null }))
    .filter((v) => v.name)
  const description = p.description ? sanitizeHtml(p.description.split(/\n{2,}|\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${x.replace(/</g, '&lt;')}</p>`).join('')) : ''
  return {
    type: 'physical',
    name: clean(cleanMarketplaceName(p.title ?? ''), 160),
    description,
    price,
    compareAtPrice: compareAt != null && price != null && compareAt > price ? compareAt : null,
    currency: cheapest?.price?.currency?.toUpperCase() ?? variants.find((v) => v.price?.currency)?.price?.currency?.toUpperCase() ?? null,
    variantLabel: named.length > 1 ? 'Option' : null,
    variants: named.length > 1 ? named.slice(0, 50) : [],
    images: dedupe(variants.flatMap((v) => (v.images ?? []).map((i) => i.url).filter((u): u is string => !!u && /^https?:\/\//.test(u)))).slice(0, 20),
    video: null,
    features: [],
    faqs: [],
    testimonials: [],
    brand: p.brand ? clean(p.brand, 80) : null,
  }
}

/** La fiche Firecrawl fait foi pour nom, prix, variantes ; l'analyse du HTML apporte description riche, FAQ, avis, vidéo. */
function combineBrowser(fp: ImportDraft, html: ImportDraft | null): ImportDraft {
  if (!html) return { ...fp, features: featuresFromHtml(fp.description) }
  const richer = stripTags(html.description).length > stripTags(fp.description).length ? html.description : fp.description
  return {
    ...fp,
    name: fp.name || html.name,
    price: fp.price ?? html.price,
    currency: fp.price != null ? fp.currency : html.currency,
    compareAtPrice: fp.compareAtPrice ?? html.compareAtPrice,
    variants: fp.variants.length ? fp.variants : html.variants,
    variantLabel: fp.variants.length ? fp.variantLabel : html.variantLabel,
    description: richer,
    images: dedupe([...fp.images, ...html.images]).slice(0, 20),
    video: html.video,
    features: html.features.length ? html.features : featuresFromHtml(richer),
    faqs: html.faqs,
    testimonials: html.testimonials,
    brand: fp.brand ?? html.brand,
  }
}

const completeness = (d: ImportDraft) => (d.name ? 1 : 0) + (d.price != null ? 1 : 0) + (d.images.length ? 1 : 0)

/** Texte lisible d'une page HTML (pour l'IA quand Firecrawl n'a pas fourni de markdown). */
function htmlToText(html: string): string {
  return stripTags(html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, '\n'))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

/** Images candidates d'une page (OpenGraph, grandes images, images du markdown) pour l'IA. */
async function imageCandidates(page: Pick<FetchedPage, 'html' | 'url' | 'markdown'>): Promise<string[]> {
  const scan = await scanHtml(page.html, page.url)
  const og = [...(scan.meta.get('og:image') ?? []), ...(scan.meta.get('og:image:secure_url') ?? [])].map((x) => absolute(x, page.url)).filter((x): x is string => !!x)
  const md = [...(page.markdown ?? '').matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]!).filter((u) => !IMAGE_NOISE.test(u))
  return dedupe([...og, ...pageImages(scan), ...md]).slice(0, 60)
}

/** Complète un brouillon avec l'extraction IA, sans écraser ce que les données structurées ont trouvé. */
function mergeAi(base: ImportDraft | null, ai: AiExtraction, structured = false): ImportDraft {
  // Sans données structurées (seulement le titre ou les balises de partage), l'IA lit mieux la page : elle passe devant.
  if (base && !structured) {
    base = { ...base, name: ai.name ? '' : base.name, price: ai.price != null ? null : base.price, currency: ai.price != null ? null : base.currency, description: ai.description ? '' : base.description }
  }
  const d: ImportDraft = base ?? { type: 'physical', name: '', description: '', price: null, compareAtPrice: null, currency: null, variantLabel: null, variants: [], images: [], video: null, features: [], faqs: [], testimonials: [], brand: null }
  const description = d.description && stripTags(d.description).length > 80 ? d.description : sanitizeHtml(ai.description)
  return {
    ...d,
    name: d.name || clean(ai.name, 160),
    price: d.price ?? ai.price,
    compareAtPrice: d.compareAtPrice ?? (ai.compareAtPrice != null && ai.price != null && ai.compareAtPrice > ai.price ? ai.compareAtPrice : null),
    currency: d.currency ?? ai.currency,
    brand: d.brand ?? ai.brand,
    description,
    features: d.features.length ? d.features : ai.features.map((f) => clean(f, 200)).filter(Boolean),
    variantLabel: d.variantLabel ?? (ai.variants.length ? (ai.variantLabel ?? 'Option') : null),
    variants: d.variants.length ? d.variants : ai.variants.map((v) => ({ name: clean(v.name, 80), price: v.price, available: true, sku: null })).filter((v) => v.name),
    images: dedupe([...ai.imageUrls, ...d.images]).slice(0, 20),
    faqs: d.faqs.length ? d.faqs : ai.faqs,
  }
}

function finishWarnings(draft: ImportDraft, warnings: string[], storeCurrency: string) {
  const out = warnings.filter((w) => !/introuvable|Aucune image|peu structurée/.test(w))
  if (!draft.name) out.push('Nom du produit introuvable : à saisir.')
  if (draft.price == null) out.push('Prix introuvable : à saisir.')
  if (!draft.images.length) out.push('Aucune image détectée.')
  if (draft.currency && draft.currency !== storeCurrency) {
    // Le franc CFA (XOF, XAF) est arrimé à l'euro : 1 EUR = 655,957 FCFA, conversion exacte possible.
    const fcfa = draft.currency === 'EUR' && (storeCurrency === 'XOF' || storeCurrency === 'XAF') && draft.price != null ? Math.round((draft.price * 655.957) / 5) * 5 : null
    out.push(
      `Prix en ${draft.currency} sur le site source : votre boutique est en ${storeCurrency}.${fcfa != null ? ` ${(draft.price ?? 0).toLocaleString('fr-FR')} € = ${fcfa.toLocaleString('fr-FR')} FCFA (prix d’achat, ajoutez votre marge et la livraison).` : ''} Ajustez le prix avant d’importer.`,
    )
  }
  return out
}

/**
 * Lit une page produit, de la méthode la plus rapide à la plus robuste, et s'arrête dès que
 * nom + prix + images sont trouvés :
 * 1. lecture directe (+ API Shopify) ; 2. Firecrawl (navigateur réel, proxys) si la page est bloquée,
 * rendue en JavaScript ou incomplète ; 3. IA sur le texte de la page pour combler ce qui manque.
 */
export async function previewFromUrl(rawUrl: string, storeCurrency: string, kind: 'physical' | 'digital' = 'physical'): Promise<UrlPreview> {
  let renderedPage: FetchedPage | null = null
  const url = new URL(rawUrl)
  const log: string[] = []
  let best: { r: Omit<UrlPreview, 'domain'>; page: FetchedPage | null } | null = null
  let lastPage: FetchedPage | null = null
  const consider = (r: Omit<UrlPreview, 'domain'>, page: FetchedPage | null) => {
    if (!best || completeness(r.draft) > completeness(best.r.draft)) best = { r, page }
  }
  const done = () => best && completeness(best.r.draft) === 3

  // 1. Lecture directe.
  try {
    const page = await fetchDirect(rawUrl)
    lastPage = page
    if (/json/i.test(page.contentType) && page.status < 400) {
      // Lien direct vers l'API Shopify (…/products/x.js ou .json).
      const data = JSON.parse(page.html) as ShopifyProduct | { product: ShopifyProduct }
      const product = 'product' in data && data.product ? data.product : (data as ShopifyProduct)
      consider({ sourceUrl: page.url, detected: ['shopify'], warnings: [], draft: draftFromShopify(fromShopify(product, page.url.endsWith('.js'), new URL(page.url).origin)), fetchedVia: 'direct' }, page)
    } else if (!looksBlocked(page)) {
      consider({ ...(await extractProduct(page.html, page.url)), fetchedVia: 'direct' }, page)
    } else {
      log.push(`direct bloqué (${page.status})`)
    }
  } catch (e) {
    log.push(`direct: ${(e as Error).message}`)
  }

  // 1 bis. Page bloquée mais adresse Shopify (/products/…) : l'API produit répond souvent quand même.
  if (!done() && shopifyHandle(url)) {
    const shopify = await tryShopify(url, null)
    if (shopify?.name) consider({ sourceUrl: rawUrl, detected: ['shopify'], warnings: [], draft: draftFromShopify(shopify), fetchedVia: 'direct' }, lastPage)
  }

  // 2. Firecrawl : vrai navigateur, JavaScript exécuté, proxys anti-blocage.
  const browser = await firecrawlAvailable()
  if (!done() && browser) {
    try {
      const page = await fetchWithFirecrawl(rawUrl)
      const blocked = softBlocked(rawUrl, page)
      if (!blocked) {
        lastPage = page
        renderedPage = page
      }
      const fromHtml = page.html && !blocked ? await extractProduct(page.html, page.url, { allowShopifyFetch: false }) : null
      if (page.product?.title && !(blocked && !page.product.variants?.length)) {
        const draft = combineBrowser(draftFromFirecrawl(page.product), fromHtml?.draft ?? null)
        consider({ sourceUrl: page.url, detected: ['browser', ...(fromHtml?.detected ?? []).filter((x) => x !== 'page')], warnings: [], draft, fetchedVia: 'firecrawl' }, page)
      } else if (fromHtml) {
        consider({ ...fromHtml, fetchedVia: 'firecrawl' }, page)
      }
    } catch (e) {
      log.push(`firecrawl: ${(e as Error).message}`)
      console.warn('[import-url] firecrawl', rawUrl, (e as Error).message)
    }
  }

  // 3. IA sur le texte de la page : comble nom, prix, images, description manquants.
  const current = best as { r: Omit<UrlPreview, 'domain'>; page: FetchedPage | null } | null
  // L'IA lit de préférence la page rendue par le navigateur distant : prix et contenus affichés en JavaScript y figurent.
  const page = renderedPage?.markdown ? renderedPage : (current?.page ?? lastPage)
  if (!done() && aiAvailable() && page && (page.markdown || page.html) && !(page.status >= 400 && !page.markdown)) {
    try {
      const text = page.markdown ?? htmlToText(page.html)
      if (text.length > 40) {
        const ai = await extractWithAi({ text, url: page.url, imageCandidates: await imageCandidates(page), kind })
        if (ai.found) {
          const structured = (current?.r.detected ?? []).some((x) => x === 'shopify' || x === 'jsonld' || x === 'microdata')
          const draft = mergeAi(current?.r.draft ?? null, ai, structured)
          const r = { sourceUrl: page.url, detected: [...(current?.r.detected ?? []), 'ai' as const], warnings: current?.r.warnings ?? [], draft, fetchedVia: page.via }
          if (!current || completeness(draft) >= completeness(current.r.draft)) best = { r, page }
        }
      }
    } catch (e) {
      log.push(`ia: ${(e as Error).message}`)
    }
  }

  const final = best as { r: Omit<UrlPreview, 'domain'>; page: FetchedPage | null } | null
  // Moins de 2 éléments sur 3 (nom, prix, photos) : fiche inexploitable, on propose plutôt de coller le texte.
  if (!final || completeness(final.r.draft) < 2) {
    console.warn('[import-url] échec', rawUrl, log.join(' | '))
    throw badRequest(
      browser
        ? 'Ce site bloque la lecture automatique de ses pages. Copie le texte de la page produit (Ctrl+A puis Ctrl+C) et colle-le dans « Coller le contenu de la page ».'
        : 'Impossible de lire cette page (site protégé ou rendu en JavaScript). Colle le texte de la page produit dans « Coller le contenu de la page ».',
      'page_unreadable',
    )
  }
  const draft = { ...final.r.draft, type: kind }
  if (kind === 'digital') Object.assign(draft, { variants: [], variantLabel: null })
  if (draft.compareAtPrice != null && draft.price != null && draft.compareAtPrice <= draft.price) draft.compareAtPrice = null
  return { ...final.r, draft, warnings: finishWarnings(draft, final.r.warnings, storeCurrency), domain: url.hostname.replace(/^www\./, '') }
}

/** Secours ultime : le vendeur colle le texte de la page (et éventuellement des liens d'images) ; l'IA remplit la fiche. */
export async function previewFromText(text: string, storeCurrency: string, sourceUrl?: string | null, kind: 'physical' | 'digital' = 'physical'): Promise<UrlPreview> {
  const candidates = dedupe([...text.matchAll(/https?:\/\/[^\s"'<>)]+\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>)]*)?/gi)].map((m) => m[0]))
  const ai = await extractWithAi({ text, url: sourceUrl, imageCandidates: candidates, kind })
  if (!ai.found && !ai.name) throw badRequest('Aucun produit reconnu dans ce texte. Copie bien le contenu de la page produit (nom, prix, description).', 'no_product')
  const draft = { ...mergeAi(null, ai), type: kind }
  if (kind === 'digital') Object.assign(draft, { variants: [], variantLabel: null })
  const domain = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'texte collé'
  return { sourceUrl: sourceUrl ?? '', domain, detected: ['ai'], warnings: finishWarnings(draft, [], storeCurrency), draft, fetchedVia: 'text' }
}
