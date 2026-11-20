/**
 * Écriture des produits, partagée par l'éditeur (routes/products.ts) et les imports (CSV, URL).
 * Mêmes règles partout : HTML nettoyé, variantes synchronisées, périmètre du membre étendu.
 */
import type { ProductInput } from '@zuri/shared'
import { and, eq, notInArray } from 'drizzle-orm'
import { db, type Tx } from '../db/client'
import { productVariants, products, storeMemberProducts } from '../db/schema'
import type { StoreAccess } from '../lib/context'
import { sanitizeHtml } from '../lib/sanitize'
import { HttpError } from '../lib/errors'

export function toRow(input: ProductInput, storeId: string, baseCurrency: string) {
  const { variants: _variants, ...rest } = input
  return {
    ...rest,
    storeId,
    baseCurrency,
    // Le HTML vendeur est nettoyé à l'écriture : le storefront peut l'afficher sans risque.
    description: sanitizeHtml(input.description),
    content: { ...input.content, customText: input.content.customText ? sanitizeHtml(input.content.customText) : undefined },
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

/** Crée un produit (déjà validé par productInputSchema) et l'ajoute au périmètre du membre. */
export async function createProduct(access: StoreAccess, store: { id: string; currency: string; kind?: string | null }, input: ProductInput): Promise<string> {
  assertStoreKind(store, input.type)
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(products).values(toRow(input, store.id, store.currency)).returning({ id: products.id })
    if (!row) throw new Error('Création produit échouée')
    await syncVariants(tx, row.id, input.variants)
    return row.id
  })
  await addToScope(access, store.id, id)
  return id
}
