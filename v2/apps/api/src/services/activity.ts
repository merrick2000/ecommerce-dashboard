/**
 * Journal d'activité (hors commandes : celles-ci ont order_events).
 * Ne fait jamais échouer l'action journalisée.
 */
import type { Context } from 'hono'
import { db } from '../db/client'
import { activityLog } from '../db/schema'
import type { AppEnv } from '../lib/context'

export interface ActivityEntry {
  entityType: 'product' | 'promo' | 'zone' | 'store' | 'team' | 'payment_account'
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
      data: entry.data,
    })
  } catch (err) {
    console.error('[activity]', err)
  }
}
