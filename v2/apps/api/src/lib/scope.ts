/**
 * Périmètre produits d'un membre : un closer limité à certains produits ne voit
 * que les commandes, clients, statistiques et activités qui touchent ces produits.
 * Chaque requête de lecture/écriture « store-scoped » passe par ces filtres.
 */
import { and, eq, exists, inArray, sql as dsql, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { customers, orderItems, orders, products } from '../db/schema'
import type { StoreAccess } from './context'
import { notFound } from './errors'

const NOTHING = dsql`false`

/** Commandes visibles : au moins une ligne sur un produit du périmètre. */
export function orderScope(access: StoreAccess): SQL | undefined {
  if (!access.productIds) return undefined
  if (!access.productIds.length) return NOTHING
  return exists(
    db
      .select({ one: dsql`1` })
      .from(orderItems)
      .where(and(eq(orderItems.orderId, orders.id), inArray(orderItems.productId, access.productIds))),
  )
}

/** Produits visibles. */
export function productScope(access: StoreAccess): SQL | undefined {
  if (!access.productIds) return undefined
  if (!access.productIds.length) return NOTHING
  return inArray(products.id, access.productIds)
}

/** Clients visibles : ceux qui ont au moins une commande visible. */
export function customerScope(access: StoreAccess): SQL | undefined {
  const scope = orderScope(access)
  if (!scope) return undefined
  if (scope === NOTHING) return NOTHING
  return exists(
    db
      .select({ one: dsql`1` })
      .from(orders)
      .where(and(eq(orders.customerId, customers.id), scope)),
  )
}

export const inProductScope = (access: StoreAccess, productId: string | null | undefined) => !access.productIds || (!!productId && access.productIds.includes(productId))

/** Charge une commande de la boutique, uniquement si elle est dans le périmètre (sinon 404). */
export async function loadScopedOrder(access: StoreAccess, storeId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId), orderScope(access)))
    .limit(1)
  if (!order) throw notFound('Commande')
  return order
}

/** Vérifie que tous les produits demandés sont dans le périmètre (sinon 404 sur le premier hors périmètre). */
export function assertProductsInScope(access: StoreAccess, productIds: string[]) {
  for (const id of productIds) if (!inProductScope(access, id)) throw notFound('Produit')
}
