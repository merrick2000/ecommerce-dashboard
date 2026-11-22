import { and, eq, gte, inArray, lt, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { orderItems, orders, pageEvents, products, users } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { can, requirePermission } from '../lib/auth'
import { orderScope } from '../lib/scope'
import { v } from '../lib/validate'
import { productProfit, profitSeries, profitTotals, type ProfitContext } from '../services/profit'

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
  // Bénéfice réel (période et période précédente) : seulement pour ceux qui voient le chiffre d'affaires.
  const prevStartDay = new Date(Date.parse(`${startDay}T00:00:00Z`) - span).toISOString().slice(0, 10)
  const prevEndDay = addDays(startDay, -1)
  const pctx = (s: Date, e: Date, sd: string, ed: string): ProfitContext => ({ storeId: store.id, timezone: tz, start: s, end: e, startDay: sd, endDay: ed, access })
  const profit = revenueVisible ? await Promise.all([profitTotals(pctx(start, end, startDay, endDay)), profitTotals(pctx(prevStart, start, prevStartDay, prevEndDay))]).then(([current, previous]) => ({ current, previous })) : null
  return c.json({
    range: { from: start, to: new Date(end.getTime() - 1) },
    currency: store.currency,
    revenueVisible,
    profit,
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
      let profit = null
      if (revenueVisible) {
        const pctx: ProfitContext = { storeId: store.id, timezone: tz, start, end, startDay, endDay, access }
        const [pTotals, pSeries, pProducts] = await Promise.all([profitTotals(pctx), profitSeries(pctx, groupBy), breakdown === 'product' ? productProfit(pctx) : Promise.resolve(null)])
        if (pProducts) rows = rows.map((r) => ({ ...r, profit: pProducts.get(String(r.key)) ?? null }))
        profit = { totals: pTotals, series: pSeries }
      }
      return c.json({
        range: { from: startDay, to: endDay, timezone: tz },
        currency: store.currency,
        revenueVisible,
        groupBy,
        totals: shape(totals),
        series: series.map(shape),
        breakdown: breakdown === 'none' ? null : { by: breakdown, rows: rows.map(shape) },
        profit,
      })
    },
  )

/**
 * Performance du tunnel de vente : order bump (proposé / accepté), chaque upsell ou offre de repli
 * (accepté / refusé) et chiffre ajouté par le tunnel. Filtrable par produit principal.
 */
export const funnelStatsRoute = new Hono<AppEnv>().get(
  '/funnel',
  requirePermission('stats.view'),
  v('query', rangeSchema.extend({ productId: z.string().max(40).optional() })),
  async (c) => {
    const store = c.get('store')
    const access = c.get('access')
    const revenueVisible = can(access, 'stats.revenue')
    const { from, to, productId } = c.req.valid('query')
    const tz = store.timezone
    const startDay = from.toISOString().slice(0, 10)
    const endDay = to.toISOString().slice(0, 10)
    const start = localMidnight(startDay, tz)
    const end = localMidnight(addDays(endDay, 1), tz)
    const scope = orderScope(access)
    const where = dsql`${orders.storeId} = ${store.id} and ${orders.createdAt} >= ${start.toISOString()}::timestamptz and ${orders.createdAt} < ${end.toISOString()}::timestamptz
      ${scope ? dsql`and ${scope}` : dsql``}
      ${productId ? dsql`and exists (select 1 from order_items m where m.order_id = ${orders.id} and m.role = 'main' and m.product_id = ${productId})` : dsql``}`

    const [bumpRows, answerRows, revenueRows, funnels] = await Promise.all([
      db.execute<{ offered: number; accepted: number; orders: number }>(dsql`
        select count(*) filter (where ${orders.metadata}->'funnel'->>'bumpOffered' = 'true')::int as offered,
               count(*) filter (where ${orders.metadata}->'funnel'->>'bumpAccepted' = 'true')::int as accepted,
               count(*) filter (where ${orders.metadata} ? 'funnel')::int as orders
        from ${orders} where ${where}`),
      db.execute<{ offer_id: string; answer: string; n: number }>(dsql`
        select a.key as offer_id, a.value as answer, count(*)::int as n
        from ${orders}, jsonb_each_text(coalesce(${orders.metadata}->'funnel'->'answers', '{}'::jsonb)) a
        where ${where} group by 1, 2`),
      db.execute<{ role: string; lines: number; booked: number; collected: number }>(dsql`
        select oi.role, count(*)::int as lines,
               coalesce(sum(oi.total) filter (where ${orders.fulfillmentStatus} not in ('cancelled', 'returned')), 0)::float as booked,
               coalesce(sum(oi.total) filter (where ${orders.paymentStatus} = 'paid'), 0)::float as collected
        from order_items oi join ${orders} on ${orders.id} = oi.order_id
        where oi.role <> 'main' and ${where} group by oi.role`),
      db.select({ id: products.id, name: products.name, funnel: products.funnel }).from(products).where(and(eq(products.storeId, store.id), productId ? eq(products.id, productId) : dsql`${products.funnel} is not null`)),
    ])
    const titles = new Map<string, { title: string; role: 'upsell' | 'downsell'; product: string }>()
    for (const p of funnels) for (const u of p.funnel?.upsells ?? []) {
      titles.set(u.id, { title: u.title, role: 'upsell', product: p.name })
      if (u.downsell) titles.set(u.downsell.id, { title: u.downsell.title, role: 'downsell', product: p.name })
    }
    const offers = new Map<string, { id: string; title: string; role: string; product: string | null; accepted: number; declined: number }>()
    for (const r of answerRows) {
      const t = titles.get(r.offer_id)
      const o = offers.get(r.offer_id) ?? { id: r.offer_id, title: t?.title ?? r.offer_id, role: t?.role ?? 'upsell', product: t?.product ?? null, accepted: 0, declined: 0 }
      if (r.answer === 'accepted') o.accepted += Number(r.n)
      else o.declined += Number(r.n)
      offers.set(r.offer_id, o)
    }
    const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)
    const b = [...bumpRows][0]
    const rev = Object.fromEntries([...revenueRows].map((r) => [r.role, r]))
    const money = (n: number | undefined) => (revenueVisible ? Math.round(Number(n ?? 0) * 100) / 100 : null)
    const sum = (k: 'booked' | 'collected') => ['bump', 'upsell', 'downsell'].reduce((a, role) => a + Number(rev[role]?.[k] ?? 0), 0)
    return c.json({
      range: { from: startDay, to: endDay },
      currency: store.currency,
      revenueVisible,
      ordersWithFunnel: Number(b?.orders ?? 0),
      bump: { offered: Number(b?.offered ?? 0), accepted: Number(b?.accepted ?? 0), rate: rate(Number(b?.accepted ?? 0), Number(b?.offered ?? 0)), revenueBooked: money(rev.bump?.booked) },
      offers: [...offers.values()].map((o) => ({ ...o, rate: rate(o.accepted, o.accepted + o.declined) })).sort((x, y) => y.accepted - x.accepted),
      revenue: { booked: money(sum('booked')), collected: money(sum('collected')), upsellBooked: money(rev.upsell?.booked), downsellBooked: money(rev.downsell?.booked) },
    })
  },
)

/**
 * Tableau de bord des boutiques digitales : tunnel de paiement (commandes créées, payées, en attente, refusées),
 * raisons des refus, opérateurs Mobile Money, paniers abandonnés et récupérés, téléchargements.
 */
export const digitalStatsRoute = new Hono<AppEnv>().get('/digital', requirePermission('stats.view'), v('query', rangeSchema), async (c) => {
  const store = c.get('store')
  const access = c.get('access')
  const revenueVisible = can(access, 'stats.revenue')
  const { from, to } = c.req.valid('query')
  const tz = store.timezone
  const startDay = from.toISOString().slice(0, 10)
  const endDay = to.toISOString().slice(0, 10)
  const start = localMidnight(startDay, tz)
  const end = localMidnight(addDays(endDay, 1), tz)
  const scope = orderScope(access)
  const inRange = dsql`${orders.storeId} = ${store.id} and ${orders.createdAt} >= ${start.toISOString()}::timestamptz and ${orders.createdAt} < ${end.toISOString()}::timestamptz ${scope ? dsql`and ${scope}` : dsql``}`
  const failed = dsql`(${orders.paymentStatus} = 'failed' or (${orders.paymentStatus} = 'pending' and coalesce(${orders.poStatus}, '') in ('failed', 'mismatch')))`
  const leadScope = access.productIds ? (access.productIds.length ? dsql`and l.product_id in (${dsql.join(access.productIds.map((id) => dsql`${id}`), dsql`, `)})` : dsql`and false`) : dsql``

  const [funnel, reasons, operators, carts, dl] = await Promise.all([
    db.execute<{ created: number; paid: number; pending: number; failed: number; refunded: number; revenue: number }>(dsql`
      select count(*)::int as created,
             count(*) filter (where ${orders.paymentStatus} = 'paid')::int as paid,
             count(*) filter (where ${orders.paymentStatus} = 'pending' and not ${failed})::int as pending,
             count(*) filter (where ${failed})::int as failed,
             count(*) filter (where ${orders.paymentStatus} = 'refunded')::int as refunded,
             coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)::float as revenue
      from ${orders} where ${inRange}`),
    db.execute<{ reason: string; n: number }>(dsql`
      select split_part(${orders.poFailure}, ' : ', 1) as reason, count(*)::int as n
      from ${orders} where ${inRange} and ${orders.poFailure} is not null and ${orders.paymentStatus} <> 'paid'
      group by 1 order by 2 desc limit 8`),
    db.execute<{ operator: string; n: number; revenue: number }>(dsql`
      select ${orders.poOperator} as operator, count(*)::int as n, coalesce(sum(${orders.total}), 0)::float as revenue
      from ${orders} where ${inRange} and ${orders.paymentStatus} = 'paid' and ${orders.poOperator} is not null
      group by 1 order by 2 desc limit 8`),
    db.execute<{ open: number; recovered: number; recovered_revenue: number }>(dsql`
      select count(*) filter (where l.converted_at is null)::int as open,
             count(*) filter (where l.converted_at is not null)::int as recovered,
             coalesce(sum(o.total) filter (where l.converted_at is not null), 0)::float as recovered_revenue
      from leads l left join orders o on o.id = l.converted_order_id
      where l.store_id = ${store.id} and l.created_at >= ${start.toISOString()}::timestamptz and l.created_at < ${end.toISOString()}::timestamptz ${leadScope}`),
    db.execute<{ downloads: number; never: number }>(dsql`
      select (select count(*)::int from downloads d join ${orders} on ${orders.id} = d.order_id where ${inRange}) as downloads,
             count(*) filter (where not exists (select 1 from downloads d2 where d2.order_id = ${orders.id}))::int as never
      from ${orders} where ${inRange} and ${orders.paymentStatus} = 'paid'`),
  ])
  const f = [...funnel][0]!
  const cr = [...carts][0]!
  const d = [...dl][0]!
  const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)
  const m = (n: number) => (revenueVisible ? Math.round(Number(n) * 100) / 100 : null)
  return c.json({
    range: { from: startDay, to: endDay },
    currency: store.currency,
    revenueVisible,
    payments: { created: f.created, paid: f.paid, pending: f.pending, failed: f.failed, refunded: f.refunded, paymentRate: rate(f.paid, f.created), revenue: m(f.revenue), averageOrder: f.paid ? m(f.revenue / f.paid) : null },
    failureReasons: [...reasons].map((r) => ({ reason: r.reason, count: Number(r.n) })),
    operators: [...operators].map((o) => ({ operator: o.operator, count: Number(o.n), revenue: m(o.revenue) })),
    carts: { open: cr.open, recovered: cr.recovered, recoveredRevenue: m(cr.recovered_revenue), recoveryRate: rate(cr.recovered, cr.open + cr.recovered) },
    downloads: { total: Number(d.downloads ?? 0), paidNeverDownloaded: Number(d.never ?? 0) },
  })
})
