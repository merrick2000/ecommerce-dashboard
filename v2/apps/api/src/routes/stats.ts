import { and, eq, gte, inArray, lt, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { orderItems, orders, pageEvents, users } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { can, requirePermission } from '../lib/auth'
import { orderScope } from '../lib/scope'
import { v } from '../lib/validate'

const rangeSchema = z.object({
  from: z.coerce.date().default(() => new Date(Date.now() - 29 * 86400_000)),
  to: z.coerce.date().default(() => new Date()),
})

/** Revenu « encaissé » : payé en ligne, ou COD livré. */
const collected = dsql`(${orders.paymentStatus} = 'paid')`

const addDays = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10)

/** Instant UTC correspondant à minuit local dans `tz` (gère les fuseaux à heure d'été). */
export function localMidnight(ymd: string, tz: string): Date {
  const guess = Date.parse(`${ymd}T00:00:00Z`)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  )
  const asLocal = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!)
  return new Date(guess - (asLocal - guess))
}

export const statsRoutes = new Hono<AppEnv>().get('/overview', requirePermission('stats.view'), v('query', rangeSchema), async (c) => {
  const store = c.get('store')
  const access = c.get('access')
  const scope = orderScope(access)
  const revenueVisible = can(access, 'stats.revenue')
  const { from, to } = c.req.valid('query')
  // Jours LOCAUX de la boutique : une commande à 00h30 heure de Cotonou compte bien pour ce jour-là.
  const tz = store.timezone
  const startDay = from.toISOString().slice(0, 10)
  const endDay = to.toISOString().slice(0, 10)
  const start = localMidnight(startDay, tz)
  const end = localMidnight(addDays(endDay, 1), tz)
  const span = end.getTime() - start.getTime()
  const prevStart = new Date(start.getTime() - span)
  const inRange = (s: Date, e: Date) => and(eq(orders.storeId, store.id), gte(orders.createdAt, s), lt(orders.createdAt, e), scope)

  const kpi = (s: Date, e: Date) =>
    db
      .select({
        orders: dsql<number>`count(*)::int`,
        revenue: dsql<number>`coalesce(sum(${orders.total}) filter (where ${collected}), 0)::float`,
        paidOrders: dsql<number>`count(*) filter (where ${collected})::int`,
        codPending: dsql<number>`count(*) filter (where ${orders.paymentMethod} = 'cod' and ${orders.fulfillmentStatus} in ('new','unreachable'))::int`,
        codToShip: dsql<number>`count(*) filter (where ${orders.paymentMethod} = 'cod' and ${orders.fulfillmentStatus} = 'confirmed')::int`,
        codInTransit: dsql<number>`coalesce(sum(${orders.total}) filter (where ${orders.paymentMethod} = 'cod' and ${orders.fulfillmentStatus} = 'shipped'), 0)::float`,
        delivered: dsql<number>`count(*) filter (where ${orders.fulfillmentStatus} = 'delivered' and ${orders.kind} <> 'digital')::int`,
        returned: dsql<number>`count(*) filter (where ${orders.fulfillmentStatus} = 'returned')::int`,
        confirmedOrBeyond: dsql<number>`count(*) filter (where ${orders.paymentMethod} = 'cod' and ${orders.fulfillmentStatus} in ('confirmed','shipped','delivered','returned'))::int`,
        codTotal: dsql<number>`count(*) filter (where ${orders.paymentMethod} = 'cod')::int`,
      })
      .from(orders)
      .where(inRange(s, e))
      .then((r) => r[0]!)

  const [current, previous, daily, visitors, topProducts, sources] = await Promise.all([
    kpi(start, end),
    kpi(prevStart, start),
    // Une seule requête pour toute la série (generate_series), au lieu d'une requête par jour.
    db.execute<{ day: string; orders: number; revenue: number }>(dsql`
      select to_char(d.day, 'YYYY-MM-DD') as day,
             count(o.id)::int as orders,
             coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0)::float as revenue
      from generate_series(${startDay}::date, ${endDay}::date, interval '1 day') as d(day)
      left join orders o on o.store_id = ${store.id} and (o.created_at at time zone ${tz})::date = d.day::date
        and ${access.productIds ? dsql`exists (select 1 from order_items oi where oi.order_id = o.id and oi.product_id in (${dsql.join(access.productIds.length ? access.productIds.map((id) => dsql`${id}`) : [dsql`null`], dsql`, `)}))` : dsql`true`}
      group by d.day order by d.day`),
    db
      .select({
        visitors: dsql<number>`count(distinct ${pageEvents.sessionId}) filter (where ${pageEvents.eventType} = 'page_view')::int`,
        views: dsql<number>`count(*) filter (where ${pageEvents.eventType} = 'page_view')::int`,
        checkouts: dsql<number>`count(distinct ${pageEvents.sessionId}) filter (where ${pageEvents.eventType} = 'checkout_initiate')::int`,
      })
      .from(pageEvents)
      .where(and(eq(pageEvents.storeId, store.id), gte(pageEvents.createdAt, start), lt(pageEvents.createdAt, end), access.productIds ? (access.productIds.length ? inArray(pageEvents.productId, access.productIds) : dsql`false`) : undefined))
      .then((r) => r[0]!),
    db
      .select({
        productId: orderItems.productId,
        name: orderItems.name,
        orders: dsql<number>`count(distinct ${orders.id})::int`,
        units: dsql<number>`sum(${orderItems.quantity})::int`,
        revenue: dsql<number>`coalesce(sum(${orderItems.total}) filter (where ${collected}), 0)::float`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(inRange(start, end), access.productIds ? (access.productIds.length ? inArray(orderItems.productId, access.productIds) : dsql`false`) : undefined))
      .groupBy(orderItems.productId, orderItems.name)
      .orderBy(dsql`4 desc`)
      .limit(8),
    db
      .select({ source: dsql<string>`coalesce(nullif(${orders.utmSource}, ''), 'direct')`, orders: dsql<number>`count(*)::int`, revenue: dsql<number>`coalesce(sum(${orders.total}) filter (where ${collected}), 0)::float` })
      .from(orders)
      .where(inRange(start, end))
      .groupBy(dsql`1`)
      .orderBy(dsql`2 desc`)
      .limit(8),
  ])

  const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

  // « Mes résultats » : commandes que ce membre a prises en charge sur la période.
  const [mineRow] = await db
    .select({
      assigned: dsql<number>`count(*)::int`,
      confirmed: dsql<number>`count(*) filter (where ${orders.fulfillmentStatus} in ('confirmed','shipped','delivered','returned'))::int`,
      delivered: dsql<number>`count(*) filter (where ${orders.fulfillmentStatus} = 'delivered')::int`,
      decided: dsql<number>`count(*) filter (where ${orders.fulfillmentStatus} in ('confirmed','shipped','delivered','returned','cancelled'))::int`,
    })
    .from(orders)
    .where(and(inRange(start, end), eq(orders.assignedTo, access.userId)))
  const mine = mineRow && mineRow.assigned > 0 ? { assigned: mineRow.assigned, confirmed: mineRow.confirmed, delivered: mineRow.delivered, confirmationRate: rate(mineRow.confirmed, mineRow.decided) } : access.role === 'closer' ? { assigned: 0, confirmed: 0, delivered: 0, confirmationRate: null } : null

  // Sans l'option « voir le chiffre d'affaires », aucun montant ne sort de l'API.
  const hideMoney = <T extends Record<string, unknown>>(row: T, keys: (keyof T)[]): T => (revenueVisible ? row : { ...row, ...Object.fromEntries(keys.map((k) => [k, null])) })
  return c.json({
    range: { from: start, to: new Date(end.getTime() - 1) },
    currency: store.currency,
    revenueVisible,
    mine,
    current: hideMoney(current, ['revenue', 'codInTransit']),
    previous: hideMoney(previous, ['revenue', 'codInTransit']),
    rates: {
      conversion: rate(current.orders, visitors.visitors),
      confirmation: rate(current.confirmedOrBeyond, current.codTotal),
      delivery: rate(current.delivered, current.delivered + current.returned),
    },
    visitors,
    daily: [...daily].map((d) => hideMoney(d, ['revenue'])),
    topProducts: topProducts.map((t) => hideMoney(t, ['revenue'])),
    sources: sources.map((x) => hideMoney(x, ['revenue'])),
  })
})
  /**
   * Rapport de ventes détaillé (outil MCP get_sales_report, exports) : série par jour / semaine / mois
   * et ventilation au choix. Mêmes règles que le tableau de bord : périmètre produits, montants masqués
   * sans l'option « voir le chiffre d'affaires ». Les jours sont ceux du fuseau de la boutique.
   */
  .get(
    '/report',
    requirePermission('stats.view'),
    v(
      'query',
      rangeSchema.extend({
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
        breakdown: z.enum(['none', 'product', 'city', 'source', 'campaign', 'status', 'assignee', 'payment_method']).default('none'),
        limit: z.coerce.number().int().min(1).max(100).default(25),
      }),
    ),
    async (c) => {
      const store = c.get('store')
      const access = c.get('access')
      const revenueVisible = can(access, 'stats.revenue')
      const { from, to, groupBy, breakdown, limit } = c.req.valid('query')
      const tz = store.timezone
      const startDay = from.toISOString().slice(0, 10)
      const endDay = to.toISOString().slice(0, 10)
      const start = localMidnight(startDay, tz)
      const end = localMidnight(addDays(endDay, 1), tz)
      const where = and(eq(orders.storeId, store.id), gte(orders.createdAt, start), lt(orders.createdAt, end), orderScope(access))

      const metrics = {
        orders: dsql<number>`count(distinct ${orders.id})::int`,
        confirmed: dsql<number>`count(distinct ${orders.id}) filter (where ${orders.fulfillmentStatus} in ('confirmed','shipped','delivered','returned'))::int`,
        delivered: dsql<number>`count(distinct ${orders.id}) filter (where ${orders.fulfillmentStatus} = 'delivered')::int`,
        returned: dsql<number>`count(distinct ${orders.id}) filter (where ${orders.fulfillmentStatus} = 'returned')::int`,
        cancelled: dsql<number>`count(distinct ${orders.id}) filter (where ${orders.fulfillmentStatus} = 'cancelled')::int`,
        pending: dsql<number>`count(distinct ${orders.id}) filter (where ${orders.fulfillmentStatus} in ('new','unreachable'))::int`,
        /** Encaissé : payé en ligne ou COD livré. */
        revenueCollected: dsql<number>`coalesce(sum(${orders.total}) filter (where ${collected}), 0)::float`,
        /** Commandé (hors annulées et retours) : chiffre « en jeu ». */
        revenueBooked: dsql<number>`coalesce(sum(${orders.total}) filter (where ${orders.fulfillmentStatus} not in ('cancelled','returned')), 0)::float`,
      }
      const period = dsql<string>`to_char(date_trunc(${groupBy}, ${orders.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`
      const series = await db.select({ period, ...metrics }).from(orders).where(where).groupBy(dsql`1`).orderBy(dsql`1`)

      let rows: Record<string, unknown>[] = []
      if (breakdown === 'product') {
        // Par produit : on compte les lignes de commande (unités, montant des lignes).
        rows = await db
          .select({
            key: orderItems.productId,
            label: dsql<string>`max(${orderItems.name})`,
            ...metrics,
            units: dsql<number>`sum(${orderItems.quantity})::int`,
            revenueCollected: dsql<number>`coalesce(sum(${orderItems.total}) filter (where ${collected}), 0)::float`,
            revenueBooked: dsql<number>`coalesce(sum(${orderItems.total}) filter (where ${orders.fulfillmentStatus} not in ('cancelled','returned')), 0)::float`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orders.id, orderItems.orderId))
          .where(and(where, access.productIds ? (access.productIds.length ? inArray(orderItems.productId, access.productIds) : dsql`false`) : undefined))
          .groupBy(orderItems.productId)
          .orderBy(dsql`count(distinct ${orders.id}) desc`)
          .limit(limit)
      } else if (breakdown === 'assignee') {
        rows = await db
          .select({ key: orders.assignedTo, label: dsql<string>`coalesce(max(${users.name}), 'Non attribuée')`, ...metrics })
          .from(orders)
          .leftJoin(users, eq(users.id, orders.assignedTo))
          .where(where)
          .groupBy(orders.assignedTo)
          .orderBy(dsql`count(distinct ${orders.id}) desc`)
          .limit(limit)
      } else if (breakdown !== 'none') {
        const col = {
          city: dsql<string>`coalesce(nullif(trim(${orders.city}), ''), 'inconnue')`,
          source: dsql<string>`coalesce(nullif(${orders.utmSource}, ''), 'direct')`,
          campaign: dsql<string>`coalesce(nullif(${orders.utmCampaign}, ''), 'aucune')`,
          status: dsql<string>`${orders.fulfillmentStatus}`,
          payment_method: dsql<string>`${orders.paymentMethod}`,
        }[breakdown]
        rows = await db
          .select({ key: col, label: col, ...metrics })
          .from(orders)
          .where(where)
          .groupBy(dsql`1`)
          .orderBy(dsql`count(distinct ${orders.id}) desc`)
          .limit(limit)
      }

      const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)
      const shape = <T extends Record<string, unknown>>(r: T) => {
        const m = r as unknown as { confirmed: number; delivered: number; returned: number; cancelled: number }
        return {
          ...r,
          ...(revenueVisible ? {} : { revenueCollected: null, revenueBooked: null }),
          confirmationRate: rate(m.confirmed, m.confirmed + m.cancelled),
          deliveryRate: rate(m.delivered, m.delivered + m.returned),
        }
      }
      const totals = series.reduce(
        (a, r) => {
          for (const k of ['orders', 'confirmed', 'delivered', 'returned', 'cancelled', 'pending', 'revenueCollected', 'revenueBooked'] as const) a[k] += Number(r[k])
          return a
        },
        { orders: 0, confirmed: 0, delivered: 0, returned: 0, cancelled: 0, pending: 0, revenueCollected: 0, revenueBooked: 0 },
      )
      return c.json({
        range: { from: startDay, to: endDay, timezone: tz },
        currency: store.currency,
        revenueVisible,
        groupBy,
        totals: shape(totals),
        series: series.map(shape),
        breakdown: breakdown === 'none' ? null : { by: breakdown, rows: rows.map(shape) },
      })
    },
  )
