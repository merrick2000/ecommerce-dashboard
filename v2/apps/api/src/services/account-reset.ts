/**
 * Remise à zéro d'un compte : supprime les boutiques dont il est propriétaire, avec tout leur contenu
 * (produits, commandes, clients, stats, équipe, réglages : suppression en cascade) et leurs fichiers.
 * Le compte lui-même (connexion, super admin, abonnement, parrainage) est conservé.
 */
import { and, eq, inArray, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { onboardingEmails, storeMembers, stores } from '../db/schema'
import { deletePrefix } from './storage'

async function ownedStoreIds(userId: number): Promise<string[]> {
  const rows = await db.select({ id: storeMembers.storeId }).from(storeMembers).where(and(eq(storeMembers.userId, userId), eq(storeMembers.role, 'owner')))
  return rows.map((r) => r.id)
}

/** Ce qui sera effacé, pour l'afficher avant de confirmer. */
export async function resetPreview(userId: number) {
  const ids = await ownedStoreIds(userId)
  if (!ids.length) return { stores: [], products: 0, orders: 0, customers: 0 }
  const list = await db.select({ id: stores.id, name: stores.name, slug: stores.slug }).from(stores).where(inArray(stores.id, ids))
  const count = async (table: string) => {
    const [r] = await db.execute<{ n: number }>(dsql`select count(*)::int as n from ${dsql.identifier(table)} where store_id in ${ids}`)
    return r?.n ?? 0
  }
  return { stores: list, products: await count('products'), orders: await count('orders'), customers: await count('customers') }
}

export async function resetAccount(userId: number) {
  const ids = await ownedStoreIds(userId)
  if (ids.length) await db.delete(stores).where(inArray(stores.id, ids))
  await db.delete(onboardingEmails).where(eq(onboardingEmails.userId, userId))
  // Fichiers : après la base, pour ne jamais laisser une boutique pointer vers des images effacées.
  let files = 0
  for (const id of ids) files += await deletePrefix(`stores/${id}/`).catch(() => 0)
  return { stores: ids.length, files }
}
