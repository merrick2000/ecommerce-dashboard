/**
 * Journal d'activité (hors commandes : celles-ci ont order_events).
 * Ne fait jamais échouer l'action journalisée.
 */
import type { Context } from 'hono'
import { db } from '../db/client'
import { activityLog, orderEvents, orders } from '../db/schema'
import { and, eq, gte, inArray, sql as dsql } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../lib/context'

export interface ActivityEntry {
  entityType: 'product' | 'promo' | 'zone' | 'store' | 'team' | 'payment_account' | 'expense'
  entityId?: string | number | null
  entityLabel?: string | null
  action: string
  message: string
  productIds?: string[] | null
  data?: Record<string, unknown>
}

export async function logActivity(c: Context<AppEnv>, entry: ActivityEntry) {
  try {
    await db.insert(activityLog).values({
      storeId: c.get('store').id,
      userId: c.get('user').id,
      entityType: entry.entityType,
      entityId: entry.entityId == null ? null : String(entry.entityId),
      entityLabel: entry.entityLabel?.slice(0, 255) ?? null,
      action: entry.action,
      message: entry.message,
      productIds: entry.productIds ?? null,
      data: c.get('apiKey') ? { ...entry.data, via: 'api', apiKey: c.get('apiKey')!.name } : entry.data,
    })
  } catch (err) {
    console.error('[activity]', err)
  }
}

/**
 * Historique des commandes : les événements écrits pendant une requête faite avec une clé API
 * sont marqués « via api » (visible dans l'activité), sans toucher à chaque écriture d'événement.
 */
export const tagApiOrderEvents = createMiddleware<AppEnv>(async (c, next) => {
  const key = c.get('apiKey')
  if (!key || c.req.method === 'GET') return next()
  const started = new Date(Date.now() - 1000)
  await next()
  try {
    await db
      .update(orderEvents)
      .set({ data: dsql`coalesce(${orderEvents.data}, '{}'::jsonb) || ${JSON.stringify({ via: 'api', apiKey: key.name })}::jsonb` })
      .where(
        and(
          eq(orderEvents.userId, c.get('user').id),
          gte(orderEvents.createdAt, started),
          inArray(orderEvents.orderId, db.select({ id: orders.id }).from(orders).where(eq(orders.storeId, c.get('store').id))),
        ),
      )
  } catch (err) {
    console.error('[activity] tag api', err)
  }
})
