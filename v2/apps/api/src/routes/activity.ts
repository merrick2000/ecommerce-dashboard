import type { ActivityItem } from '@zuri/shared'
import { sql as dsql, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { can, requirePermission } from '../lib/auth'
import { v } from '../lib/validate'
import type { AppEnv } from '../lib/context'

const PAGE_SIZE = 50
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  userId: z.coerce.number().int().positive().optional(),
  entityType: z.enum(['order', 'product', 'promo', 'zone', 'store', 'team', 'payment_account']).optional(),
})

const list = (ids: string[]) => dsql.join(ids.length ? ids.map((id) => dsql`${id}`) : [dsql`null`], dsql`, `)

/**
 * Fil d'activité : événements de commandes (order_events) + journal du reste (activity_log),
 * filtrés par le périmètre du membre (produits) et ses permissions (équipe, paiements).
 */
export const activityRoutes = new Hono<AppEnv>().get('/', requirePermission('activity.view'), v('query', querySchema), async (c) => {
  const store = c.get('store')
  const access = c.get('access')
  const { page, userId, entityType } = c.req.valid('query')
  const scope = access.productIds

  const orderScope: SQL = scope ? dsql`exists (select 1 from order_items oi where oi.order_id = o.id and oi.product_id in (${list(scope)}))` : dsql`true`
  const logScope: SQL = scope ? dsql`(a.product_ids is not null and exists (select 1 from jsonb_array_elements_text(a.product_ids) p(id) where p.id in (${list(scope)})))` : dsql`true`
  const hidden: string[] = []
  if (!can(access, 'team.manage')) hidden.push('team')
  if (!can(access, 'payments.manage')) hidden.push('payment_account')
  if (!can(access, 'store.settings')) hidden.push('store')
  const hiddenSql = hidden.length ? dsql`a.entity_type not in (${list(hidden)})` : dsql`true`
  const userSql = (col: SQL) => (userId ? dsql`${col} = ${userId}` : dsql`true`)

  const parts: SQL[] = []
  if (!entityType || entityType === 'order') {
    parts.push(dsql`
      select 'o' || oe.id as id, oe.created_at as at, oe.user_id, 'order' as entity_type, o.id as entity_id,
             o.order_number as entity_label, oe.type as action, coalesce(oe.message, oe.type) as message, oe.data->>'via' as via
      from order_events oe join orders o on o.id = oe.order_id
      where o.store_id = ${store.id} and ${orderScope} and ${userSql(dsql`oe.user_id`)}`)
  }
  if (entityType !== 'order') {
    parts.push(dsql`
      select 'a' || a.id as id, a.created_at as at, a.user_id, a.entity_type, a.entity_id,
             a.entity_label, a.action, a.message, a.data->>'via' as via
      from activity_log a
      where a.store_id = ${store.id} and ${logScope} and ${hiddenSql} and ${userSql(dsql`a.user_id`)}
        ${entityType ? dsql`and a.entity_type = ${entityType}` : dsql``}`)
  }
  const union = dsql.join(parts, dsql` union all `)
  const rows = await db.execute<{ id: string; at: Date; user_id: number | null; entity_type: string; entity_id: string | null; entity_label: string | null; action: string; message: string; via: string | null; actor_name: string | null; total: number }>(dsql`
    select f.*, u.name as actor_name, count(*) over()::int as total
    from (${union}) f left join users u on u.id = f.user_id
    order by f.at desc
    limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`)
  const data: ActivityItem[] = [...rows].map((r) => ({
    id: r.id,
    at: new Date(r.at).toISOString(),
    actor: r.user_id ? { id: Number(r.user_id), name: r.actor_name ?? 'Membre retiré' } : null,
    entityType: r.entity_type,
    entityId: r.entity_id,
    entityLabel: r.entity_label,
    action: r.action,
    message: r.message,
    via: r.via === 'api' ? 'api' : null,
  }))
  return c.json({ data, total: rows[0]?.total ?? 0, page, pageSize: PAGE_SIZE })
})
