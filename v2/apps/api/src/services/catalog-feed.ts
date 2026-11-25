/**
 * Catalogue normalisé d'une boutique, déduit uniquement des informations déjà saisies par le vendeur
 * (aucun champ technique à remplir). Source unique pour :
 * - le flux Google Merchant Center / Meta (catalogue Facebook et Instagram) ;
 * - le format produits de Shopify (/products.json) ;
 * - les exports CSV Shopify et WooCommerce ;
 * - les données structurées schema.org des pages.
 * Règles : marque = nom de la boutique, état = neuf, disponibilité = stock, prix promo = prix effectif,
 * livraison = zones de la boutique, note = avis affichés sur la page.
 */
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { deliveryZones, productVariants, products, type stores } from '../db/schema'
import { displayPrice } from './pricing'
import { publicUrl } from './storage'

type Store = typeof stores.$inferSelect

export type Availability = 'in_stock' | 'out_of_stock'

export interface CatalogVariant {
  id: string
  sku: string
  title: string
  price: number
  salePrice: number | null
  availability: Availability
  inventory: number | null
}

export interface CatalogItem {
  id: string
  sku: string
  title: string
  /** Texte brut (5 000 caractères maximum, limite Google). */
  description: string
  descriptionHtml: string
  /** Chemin de la page de vente dans la boutique (/p/…), à compléter avec l'adresse de la boutique. */
  path: string
  images: string[]
  type: 'physical' | 'digital'
  category: string | null
  brand: string
  condition: 'new'
  currency: string
  price: number
  salePrice: number | null
  availability: Availability
  inventory: number | null
  weightGrams: number | null
  variantLabel: string | null
  variants: CatalogVariant[]
  shipping: { country: string; price: number }[]
  rating: { value: number; count: number } | null
  createdAt: string
  updatedAt: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', hellip: '…' }

export function htmlToPlain(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/blockquote)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    // Mise en forme dans le texte (gras, italique, lien) : retirée sans ajouter d'espace.
    .replace(/<\/?(strong|b|em|i|u|span|a|small|mark|sup|sub|s|del|ins)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? (e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1).replace(/^x/, '0x'))) : m))
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Catalogue complet (produits actifs) d'une boutique. */
export async function storeCatalog(store: Store, opts: { includeInactive?: boolean } = {}): Promise<CatalogItem[]> {
  const rows = await db
    .select()
    .from(products)
    .where(opts.includeInactive ? eq(products.storeId, store.id) : and(eq(products.storeId, store.id), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt))
  if (!rows.length) return []
  const [variants, zones] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(and(inArray(productVariants.productId, rows.map((r) => r.id)), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.position)),
    db.select({ country: deliveryZones.country, fee: deliveryZones.fee }).from(deliveryZones).where(and(eq(deliveryZones.storeId, store.id), eq(deliveryZones.isActive, true))),
  ])
  // Livraison : le tarif le plus bas par pays (prix « à partir de » affiché par Google).
  const byCountry = new Map<string, number>()
  for (const z of zones) {
    const fee = Number(z.fee)
    const country = (z.country || store.country).toUpperCase()
    byCountry.set(country, Math.min(byCountry.get(country) ?? Infinity, fee))
  }
  const physicalShipping = [...byCountry].map(([country, price]) => ({ country, price }))

  return rows.map((p) => {
    const dp = displayPrice(p, store.currency)
    const sale = dp.effective < dp.regular ? dp.effective : null
    const inStock = !p.trackInventory || p.stock == null || p.stock > 0
    const html = p.description || ''
    const plain = htmlToPlain(html) || p.content.tagline || p.content.headline || p.name
    const testimonials = p.content.testimonials ?? []
    const images = [p.coverImage, ...(p.content.gallery ?? [])]
      .map((k) => publicUrl(k))
      .filter((u): u is string => !!u)
    const vs = variants.filter((v) => v.productId === p.id)
    return {
      id: p.id,
      sku: p.sku || p.id,
      title: cut(p.name, 150),
      description: cut(plain, 5000),
      descriptionHtml: html,
      path: `/p/${p.id}`,
      images: [...new Set(images)].slice(0, 11),
      type: p.type,
      category: p.category,
      brand: store.name,
      condition: 'new',
      currency: dp.currency,
      price: dp.regular,
      salePrice: sale,
      availability: inStock ? 'in_stock' : 'out_of_stock',
      inventory: p.trackInventory ? (p.stock ?? null) : null,
      weightGrams: p.weightGrams,
      variantLabel: p.variantLabel,
      variants: vs.map((v) => {
        const vp = displayPrice(p, store.currency, v)
        return {
          id: `${p.id}-${v.id}`,
          sku: v.sku || `${p.sku || p.id}-${v.id}`,
          title: v.name,
          price: vp.regular,
          salePrice: vp.effective < vp.regular ? vp.effective : null,
          availability: !p.trackInventory || v.stock == null || v.stock > 0 ? 'in_stock' : 'out_of_stock',
          inventory: p.trackInventory ? (v.stock ?? null) : null,
        } satisfies CatalogVariant
      }),
      // Produit digital : livré en ligne, sans frais dans le pays de la boutique.
      shipping: p.type === 'digital' ? [{ country: store.country.toUpperCase(), price: 0 }] : physicalShipping,
      rating: testimonials.length ? { value: Math.round((testimonials.reduce((s, t) => s + (t.rating ?? 5), 0) / testimonials.length) * 10) / 10, count: testimonials.length } : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    } satisfies CatalogItem
  })
}
