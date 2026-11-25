/**
 * Formats standard des produits, générés automatiquement (le vendeur ne remplit rien) :
 * - schema.org Product / ProductGroup (Google, Bing, Meta, assistants IA, comparateurs) ;
 * - flux Google Merchant Center (RSS 2.0 + espace de noms g:), aussi accepté par le catalogue Meta ;
 * - format produits de Shopify (/products.json), lu par de nombreux outils (espions de boutiques, importeurs).
 */
import type { CatalogItem, CheckoutData, PublicStore, StoreCatalog } from './types'
import { excerpt } from './content'

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
const money = (n: number, cur: string) => `${(Math.round(n * 100) / 100).toFixed(cur === 'XOF' || cur === 'XAF' ? 0 : 2)} ${cur}`
const schemaAvailability = (a: 'in_stock' | 'out_of_stock') => (a === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock')

function offerFor(o: { price: number; currency: string; inStock: boolean; url: string; sku?: string; priceValidUntil?: string | null; shipping: { country: string; price: number }[]; store: PublicStore; digital: boolean }) {
  return {
    '@type': 'Offer',
    url: o.url,
    ...(o.sku ? { sku: o.sku } : {}),
    price: o.price,
    priceCurrency: o.currency,
    availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    ...(o.priceValidUntil ? { priceValidUntil: o.priceValidUntil.slice(0, 10) } : {}),
    seller: { '@type': 'Organization', name: o.store.name },
    ...(o.shipping.length
      ? {
          shippingDetails: o.shipping.map((s) => ({
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: s.price, currency: o.currency },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: s.country },
          })),
        }
      : {}),
  }
}

/** Données structurées d'une page de vente : Product, ou ProductGroup + variantes (format recommandé par Google). */
export function productJsonLd(d: CheckoutData, ctx: { url: string; storeUrl: string; shipping: { country: string; price: number }[] }) {
  const { product: p, store } = d
  const images = [p.coverImage, ...(p.content.gallery ?? [])].filter((x): x is string => !!x && /^https?:\/\//.test(x))
  const description = excerpt(p.description, 5000) || p.content.tagline || p.content.headline || p.name
  const testimonials = (p.content.testimonials ?? []).filter((t) => t.text && t.name)
  const rating = testimonials.length
    ? {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: Math.round((testimonials.reduce((s, t) => s + (t.rating ?? 5), 0) / testimonials.length) * 10) / 10, reviewCount: testimonials.length, bestRating: 5, worstRating: 1 },
        review: testimonials.slice(0, 10).map((t) => ({ '@type': 'Review', author: { '@type': 'Person', name: t.name }, reviewRating: { '@type': 'Rating', ratingValue: t.rating ?? 5, bestRating: 5 }, reviewBody: t.text })),
      }
    : {}
  const promoEnd: string | null = null
  const base = {
    name: p.name,
    description,
    ...(images.length ? { image: images } : {}),
    brand: { '@type': 'Brand', name: store.name },
  }
  const digital = p.type === 'digital'
  const variants = p.variants ?? []
  if (variants.length > 1) {
    return {
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': `${ctx.url}#produit`,
      ...base,
      url: ctx.url,
      productGroupID: p.sku || p.id,
      variesBy: [/taille|size|pointure/i.test(p.variantLabel ?? '') ? 'https://schema.org/size' : /couleur|color|colour/i.test(p.variantLabel ?? '') ? 'https://schema.org/color' : 'https://schema.org/size'],
      ...rating,
      hasVariant: variants.map((v) => ({
        '@type': 'Product',
        name: `${p.name} - ${v.name}`,
        sku: v.sku ?? `${p.sku || p.id}-${v.id}`,
        ...(images.length ? { image: images[0] } : {}),
        offers: offerFor({ price: (v.price ?? p.price).effective, currency: p.price.currency, inStock: v.inStock && p.inStock, url: ctx.url, priceValidUntil: promoEnd, shipping: ctx.shipping, store, digital }),
      })),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${ctx.url}#produit`,
    ...base,
    sku: p.sku || p.id,
    url: ctx.url,
    ...rating,
    offers: offerFor({ price: p.price.effective, currency: p.price.currency, inStock: p.inStock, url: ctx.url, sku: p.sku, priceValidUntil: promoEnd, shipping: ctx.shipping, store, digital }),
  }
}

/** Fil d'Ariane : Boutique > Produit. */
export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
})

/** Page d'accueil d'une boutique : la boutique et la liste de ses produits. */
export function storeJsonLd(store: PublicStore, url: string, products: { name: string; url: string; image: string | null; price: number; currency: string }[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      '@id': `${url}#boutique`,
      name: store.name,
      url,
      ...(store.supportPhone ? { telephone: store.supportPhone } : {}),
      ...(store.supportEmail ? { email: store.supportEmail } : {}),
      address: { '@type': 'PostalAddress', addressCountry: store.country },
      currenciesAccepted: store.currency,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: store.name,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 100).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: p.url,
        name: p.name,
        ...(p.image ? { image: p.image } : {}),
      })),
    },
  ]
}

/** Lignes d'un produit dans le flux : une par variante (item_group_id commun), sinon une seule. */
function feedRows(it: CatalogItem) {
  if (!it.variants.length) return [{ id: it.sku, title: it.title, price: it.price, sale: it.salePrice, availability: it.availability, group: null as string | null, variant: null as string | null }]
  return it.variants.map((v) => ({ id: v.sku, title: `${it.title} - ${v.title}`, price: v.price, sale: v.salePrice, availability: it.availability === 'out_of_stock' ? 'out_of_stock' : v.availability, group: it.sku, variant: v.title }))
}

/** Flux Google Merchant Center (et catalogue Meta : même format). */
export function googleFeedXml(cat: StoreCatalog, origin: string, linkFor: (path: string) => string): string {
  const s = cat.store
  const items = cat.items.flatMap((it) =>
    feedRows(it).map((r) => {
      const label = (it.variantLabel ?? '').toLowerCase()
      const variantTag = r.variant ? (/couleur|color|colour/.test(label) ? 'color' : /taille|size|pointure/.test(label) ? 'size' : 'size') : null
      return `    <item>
      <g:id>${xml(r.id)}</g:id>
      <g:title>${xml(r.title.slice(0, 150))}</g:title>
      <g:description>${xml(it.description)}</g:description>
      <g:link>${xml(linkFor(it.path))}</g:link>
${it.images[0] ? `      <g:image_link>${xml(it.images[0])}</g:image_link>\n` : ''}${it.images.slice(1, 11).map((u) => `      <g:additional_image_link>${xml(u)}</g:additional_image_link>\n`).join('')}      <g:availability>${r.availability}</g:availability>
      <g:price>${money(r.price, it.currency)}</g:price>
${r.sale != null ? `      <g:sale_price>${money(r.sale, it.currency)}</g:sale_price>\n` : ''}      <g:condition>new</g:condition>
      <g:brand>${xml(it.brand)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn>${xml(r.id)}</g:mpn>
${it.category ? `      <g:product_type>${xml(it.category)}</g:product_type>\n` : ''}${r.group ? `      <g:item_group_id>${xml(r.group)}</g:item_group_id>\n` : ''}${variantTag && r.variant ? `      <g:${variantTag}>${xml(r.variant)}</g:${variantTag}>\n` : ''}${it.type === 'digital' ? '      <g:is_bundle>no</g:is_bundle>\n' : ''}${it.weightGrams && it.type === 'physical' ? `      <g:shipping_weight>${it.weightGrams} g</g:shipping_weight>\n` : ''}${it.shipping.map((sh) => `      <g:shipping>\n        <g:country>${xml(sh.country)}</g:country>\n        <g:service>${it.type === 'digital' ? 'Digital' : 'Standard'}</g:service>\n        <g:price>${money(sh.price, it.currency)}</g:price>\n      </g:shipping>\n`).join('')}    </item>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(s.name)}</title>
    <link>${xml(origin)}</link>
    <description>${xml(`Catalogue de ${s.name}`)}</description>
${items.join('\n')}
  </channel>
</rss>
`
}

/** Format /products.json de Shopify (identifiants numériques remplacés par les nôtres, champs identiques). */
export function shopifyProductsJson(cat: StoreCatalog, linkFor: (path: string) => string) {
  return {
    products: cat.items.map((it) => {
      const handle = it.path.replace(/^\/p\//, '')
      const variants = it.variants.length
        ? it.variants.map((v, i) => ({ id: v.id, title: v.title, option1: v.title, option2: null, option3: null, sku: v.sku, requires_shipping: it.type === 'physical', taxable: false, available: v.availability === 'in_stock', price: String(v.salePrice ?? v.price), compare_at_price: v.salePrice != null ? String(v.price) : null, grams: it.weightGrams ?? 0, position: i + 1, product_id: it.id, created_at: it.createdAt, updated_at: it.updatedAt }))
        : [{ id: `${it.id}-default`, title: 'Default Title', option1: 'Default Title', option2: null, option3: null, sku: it.sku, requires_shipping: it.type === 'physical', taxable: false, available: it.availability === 'in_stock', price: String(it.salePrice ?? it.price), compare_at_price: it.salePrice != null ? String(it.price) : null, grams: it.weightGrams ?? 0, position: 1, product_id: it.id, created_at: it.createdAt, updated_at: it.updatedAt }]
      return {
        id: it.id,
        title: it.title,
        handle,
        body_html: it.descriptionHtml || it.description,
        published_at: it.createdAt,
        created_at: it.createdAt,
        updated_at: it.updatedAt,
        vendor: it.brand,
        product_type: it.category ?? (it.type === 'digital' ? 'Digital' : ''),
        tags: [it.category, it.type === 'digital' ? 'digital' : null].filter(Boolean),
        url: linkFor(it.path),
        currency: it.currency,
        variants,
        images: it.images.map((src, i) => ({ id: `${it.id}-img${i + 1}`, src, position: i + 1, product_id: it.id, width: null, height: null })),
        options: [{ name: it.variants.length ? it.variantLabel || 'Option' : 'Title', position: 1, values: it.variants.length ? it.variants.map((v) => v.title) : ['Default Title'] }],
      }
    }),
  }
}

export const feedHeaders = (type: string) => ({ 'content-type': type, 'cache-control': 'public, max-age=900, s-maxage=900' })
export { schemaAvailability }
