import { and, eq, gte, lt, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { orderItems, orders, pageEvents } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { v } from '../lib/validate'

const rangeSchema = z.object({
  from: z.coerce.date().default(() => new Date(Date.now() - 29 * 86400_000)),
  to: z.coerce.date().default(() => new Date()),
})

/** Revenu « encaissé » : payé en ligne, ou COD livré. */
const collected = dsql`(${orders.paymentStatus} = 'paid')`

export const statsRoutes = new Hono<AppEnv>().get('/overview', v('query', rangeSchema), async (c) => {
  const store = c.get('store')
  const { from, to } = c.req.valid('query')
  const start = new Date(from.toISOString().slice(0, 10))
  const end = new Date(new Date(to.toISOString().slice(0, 10)).getTime() + 86400_000)
  const span = end.getTime() - start.getTime()
  const prevStart = new Date(start.getTime() - span)
  const inRange = (s: Date, e: Date) => and(eq(orders.storeId, store.id), gte(orders.createdAt, s), lt(orders.createdAt, e))

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
      from generate_series(${start.toISOString()}::timestamptz, ${end.toISOString()}::timestamptz - interval '1 day', interval '1 day') as d(day)
      left join orders o on o.store_id = ${store.id} and o.created_at >= d.day and o.created_at < d.day + interval '1 day'
      group by d.day order by d.day`),
    db
      .select({
        visitors: dsql<number>`count(distinct ${pageEvents.sessionId}) filter (where ${pageEvents.eventType} = 'page_view')::int`,
        views: dsql<number>`count(*) filter (where ${pageEvents.eventType} = 'page_view')::int`,
        checkouts: dsql<number>`count(distinct ${pageEvents.sessionId}) filter (where ${pageEvents.eventType} = 'checkout_initiate')::int`,
      })
      .from(pageEvents)
      .where(and(eq(pageEvents.storeId, store.id), gte(pageEvents.createdAt, start), lt(pageEvents.createdAt, end)))
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
      .where(inRange(start, end))
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
  return c.json({
    range: { from: start, to: new Date(end.getTime() - 1) },
    currency: store.currency,
    current,
    previous,
    rates: {
      conversion: rate(current.orders, visitors.visitors),
      confirmation: rate(current.confirmedOrBeyond, current.codTotal),
      delivery: rate(current.delivered, current.delivered + current.returned),
    },
    visitors,
    daily: [...daily],
    topProducts,
    sources,
  })
})
