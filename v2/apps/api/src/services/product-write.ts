/**
 * Écriture des produits, partagée par l'éditeur (routes/products.ts) et les imports (CSV, URL).
 * Mêmes règles partout : HTML nettoyé, variantes synchronisées, périmètre du membre étendu.
 */
import type { ProductInput } from '@zuri/shared'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { db, type Tx } from '../db/client'
import { productVariants, products, storeMemberProducts } from '../db/schema'
import type { StoreAccess } from '../lib/context'
import { sanitizeCustomPage, sanitizeHtml } from '../lib/sanitize'
import { HttpError } from '../lib/errors'

export function toRow(input: ProductInput, storeId: string, baseCurrency: string) {
  const { variants: _variants, ...rest } = input
  return {
    ...rest,
    storeId,
    baseCurrency,
    // Le HTML vendeur est nettoyé à l'écriture : le storefront peut l'afficher sans risque.
    description: sanitizeHtml(input.description),
    content: {
      ...input.content,
      customText: input.content.customText ? sanitizeHtml(input.content.customText) : undefined,
      // Page HTML libre : l'original est gardé pour l'édition, la version servie est nettoyée ici.
      customPage: input.content.customPage ? { ...input.content.customPage, ...sanitizeCustomPage(input.content.customPage.source) } : null,
    },
    delivery: input.type === 'digital' ? input.delivery : null,
  }
}

export async function syncVariants(tx: Tx, productId: string, variants: ProductInput['variants']) {
  const keepIds = variants.map((v) => v.id).filter((id): id is number => typeof id === 'number')
  await tx
    .delete(productVariants)
    .where(keepIds.length ? and(eq(productVariants.productId, productId), notInArray(productVariants.id, keepIds)) : eq(productVariants.productId, productId))
  for (const [position, variant] of variants.entries()) {
    const values = {
      productId,
      name: variant.name,
      sku: variant.sku ?? null,
      price: variant.price ?? null,
      costPrice: variant.costPrice ?? null,
      stock: variant.stock ?? null,
      isActive: variant.isActive,
      position,
    }
    if (variant.id) await tx.update(productVariants).set(values).where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, productId)))
    else await tx.insert(productVariants).values(values)
  }
}

/** Un membre limité à certains produits garde l'accès à ceux qu'il crée. */
export async function addToScope(access: StoreAccess, storeId: string, productId: string) {
  if (!access.productIds) return
  await db.insert(storeMemberProducts).values({ storeId, userId: access.userId, productId }).onConflictDoNothing()
}

/** Une boutique vend soit du physique, soit du digital : jamais les deux. */
export function assertStoreKind(store: { kind?: string | null }, type: string) {
  if (store.kind && store.kind !== type) {
    throw new HttpError(
      422,
      store.kind === 'physical' ? 'Cette boutique vend des produits physiques : crée une boutique digitale pour vendre des ebooks ou formations.' : 'Cette boutique vend des produits digitaux : crée une boutique physique pour vendre des produits livrés.',
      'store_kind_mismatch',
    )
  }
}

/**
 * Liens d'un produit vers d'autres produits (contenu d'un pack, offres du tunnel) :
 * même boutique, même type ; un pack ne contient ni lui-même ni un autre pack.
 */
export async function assertProductLinks(storeId: string, selfId: string | null, input: Pick<ProductInput, 'type' | 'bundle' | 'funnel'>) {
  const bundleItems = input.bundle?.items ?? []
  const offers = input.funnel ? [input.funnel.bump, ...input.funnel.upsells.flatMap((u) => [u, u.downsell])].filter((o): o is NonNullable<typeof o> => !!o) : []
  const ids = [...new Set([...bundleItems.map((i) => i.productId), ...offers.map((o) => o.productId)])]
  if (!ids.length) return
  const rows = await db.select({ id: products.id, type: products.type, name: products.name, bundle: products.bundle }).from(products).where(and(eq(products.storeId, storeId), inArray(products.id, ids)))
  const byId = new Map(rows.map((r) => [r.id, r]))
  const variantIds = [...bundleItems, ...offers].map((x) => x.variantId).filter((v): v is number => typeof v === 'number')
  const variants = variantIds.length ? await db.select({ id: productVariants.id, productId: productVariants.productId }).from(productVariants).where(inArray(productVariants.id, variantIds)) : []
  const checkRef = (ref: { productId: string; variantId: number | null }, what: string) => {
    const p = byId.get(ref.productId)
    if (!p) throw new HttpError(400, `${what} : produit introuvable dans cette boutique`, 'invalid_link')
    if (p.type !== input.type) throw new HttpError(400, `${what} : « ${p.name} » n’est pas du même type que ce produit`, 'invalid_link')
    if (ref.variantId && !variants.some((v) => v.id === ref.variantId && v.productId === ref.productId)) throw new HttpError(400, `${what} : variante introuvable pour « ${p.name} »`, 'invalid_link')
    return p
  }
  for (const item of bundleItems) {
    const p = checkRef(item, 'Pack')
    if (selfId && p.id === selfId) throw new HttpError(400, 'Un pack ne peut pas se contenir lui-même', 'invalid_link')
    if (p.bundle?.items?.length) throw new HttpError(400, `Pack : « ${p.name} » est déjà un pack`, 'invalid_link')
  }
  for (const o of offers) checkRef(o, 'Tunnel')
  const offerIds = offers.map((o) => o.id)
  if (new Set(offerIds).size !== offerIds.length) throw new HttpError(400, 'Tunnel : deux offres ont le même identifiant', 'invalid_link')
}

/** Crée un produit (déjà validé par productInputSchema) et l'ajoute au périmètre du membre. */
export async function createProduct(access: StoreAccess, store: { id: string; currency: string; kind?: string | null }, input: ProductInput): Promise<string> {
  assertStoreKind(store, input.type)
  await assertProductLinks(store.id, null, input)
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(products).values(toRow(input, store.id, store.currency)).returning({ id: products.id })
    if (!row) throw new Error('Création produit échouée')
    await syncVariants(tx, row.id, input.variants)
    return row.id
  })
  await addToScope(access, store.id, id)
  return id
}
