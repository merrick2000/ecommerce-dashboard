/**
 * Bénéfice réel d'une boutique sur une période (jours locaux de la boutique).
 *
 *   Chiffre encaissé        = commandes payées (en ligne, ou COD livrées et encaissées)
 * − Coût des produits       = Σ quantité × prix d'achat (figé sur la ligne, sinon variante, sinon produit)
 * − Coût des livraisons     = coût réel du livreur des commandes livrées ET retournées (en COD, un retour se paie aussi)
 * − Coût des retours        = frais de retour des commandes refusées
 * = Marge brute
 * − Dépenses                = pub, emballage, salaires… saisis dans « Dépenses »
 * = Bénéfice net
 *
 * Mêmes règles d'accès que les stats : périmètre produits, et rien sans l'option « voir le chiffre d'affaires ».
 */
import { sql as dsql, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { orders } from '../db/schema'
import type { StoreAccess } from '../lib/context'
import { orderScope } from '../lib/scope'

export interface ProfitContext {
  storeId: string
  timezone: string
  start: Date
  end: Date
  startDay: string
  endDay: string
  access: StoreAccess
}

export interface ProfitTotals {
  revenueCollected: number
  ordersCollected: number
  productCost: number
  deliveryCost: number
  returnCost: number
  grossProfit: number
  expenses: number
  netProfit: number
  /** Bénéfice net / chiffre encaissé, en %. */
  netMargin: number | null
  /** Bénéfice net moyen par commande encaissée. */
  profitPerOrder: number | null
  /** Unités vendues (physiques) sans prix d'achat connu : le bénéfice est surestimé d'autant. */
  unitsWithoutCost: number
  /** Commandes livrées ou retournées sans coût de livraison connu. */
  ordersWithoutDeliveryCost: number
}

const round = (n: number) => Math.round(n * 100) / 100
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

/** Coût d'achat d'une ligne : figé à la commande, sinon prix d'achat actuel ; 0 pour le digital sans coût. */
const LINE_COST = dsql`coalesce(oi.unit_cost, pv.cost_price, p.cost_price, case when oi.product_type = 'digital' then 0 end)`

function perOrderCte(ctx: ProfitContext): SQL {
  const scope = orderScope(ctx.access)
  return dsql`
    select ${orders.id} as id, ${orders.total} as total, ${orders.paymentStatus} as payment_status, ${orders.fulfillmentStatus} as fulfillment_status,
           ${orders.deliveryCost} as delivery_cost, ${orders.returnCost} as return_cost, ${orders.kind} as kind,
           (${orders.createdAt} at time zone ${ctx.timezone}) as local_at,
           (select coalesce(sum(oi.quantity * ${LINE_COST}), 0) from order_items oi
              left join product_variants pv on pv.id = oi.variant_id left join products p on p.id = oi.product_id
              where oi.order_id = ${orders.id}) as product_cost,
           (select coalesce(sum(oi.quantity) filter (where ${LINE_COST} is null), 0) from order_items oi
              left join product_variants pv on pv.id = oi.variant_id left join products p on p.id = oi.product_id
              where oi.order_id = ${orders.id}) as units_without_cost
    from ${orders}
    where ${orders.storeId} = ${ctx.storeId} and ${orders.createdAt} >= ${ctx.start.toISOString()}::timestamptz and ${orders.createdAt} < ${ctx.end.toISOString()}::timestamptz
      ${scope ? dsql`and ${scope}` : dsql``}`
}

const AGG = dsql`
  coalesce(sum(total) filter (where payment_status = 'paid'), 0)::float as revenue,
  count(*) filter (where payment_status = 'paid')::int as orders_collected,
  coalesce(sum(product_cost) filter (where payment_status = 'paid'), 0)::float as product_cost,
  coalesce(sum(units_without_cost) filter (where payment_status = 'paid'), 0)::int as units_without_cost,
  coalesce(sum(delivery_cost) filter (where fulfillment_status in ('delivered', 'returned')), 0)::float as delivery_cost,
  count(*) filter (where fulfillment_status in ('delivered', 'returned') and kind <> 'digital' and delivery_cost is null)::int as without_delivery_cost,
  coalesce(sum(return_cost) filter (where fulfillment_status = 'returned'), 0)::float as return_cost`

function expensesScope(access: StoreAccess): SQL {
  if (!access.productIds) return dsql``
  if (!access.productIds.length) return dsql`and false`
  return dsql`and e.product_id in (${dsql.join(access.productIds.map((id) => dsql`${id}`), dsql`, `)})`
}

type AggRow = { revenue: number; orders_collected: number; product_cost: number; units_without_cost: number; delivery_cost: number; without_delivery_cost: number; return_cost: number }

function totalsFrom(r: AggRow | undefined, expenses: number): ProfitTotals {
  const revenue = Number(r?.revenue ?? 0)
  const productCost = Number(r?.product_cost ?? 0)
  const deliveryCost = Number(r?.delivery_cost ?? 0)
  const returnCost = Number(r?.return_cost ?? 0)
  const gross = revenue - productCost - deliveryCost - returnCost
  const net = gross - expenses
  const n = Number(r?.orders_collected ?? 0)
  return {
    revenueCollected: round(revenue),
    ordersCollected: n,
    productCost: round(productCost),
    deliveryCost: round(deliveryCost),
    returnCost: round(returnCost),
    grossProfit: round(gross),
    expenses: round(expenses),
    netProfit: round(net),
    netMargin: pct(net, revenue),
    profitPerOrder: n ? round(net / n) : null,
    unitsWithoutCost: Number(r?.units_without_cost ?? 0),
    ordersWithoutDeliveryCost: Number(r?.without_delivery_cost ?? 0),
  }
}

export async function profitTotals(ctx: ProfitContext): Promise<ProfitTotals> {
  const [agg, exp] = await Promise.all([
    db.execute<AggRow>(dsql`with per_order as (${perOrderCte(ctx)}) select ${AGG} from per_order`),
    db.execute<{ total: number }>(dsql`
      select coalesce(sum(e.amount), 0)::float as total from store_expenses e
      where e.store_id = ${ctx.storeId} and e.spent_on between ${ctx.startDay}::date and ${ctx.endDay}::date ${expensesScope(ctx.access)}`),
  ])
  return totalsFrom([...agg][0], Number([...exp][0]?.total ?? 0))
}

/** Série du bénéfice par jour / semaine / mois (dépenses rattachées à leur date). */
export async function profitSeries(ctx: ProfitContext, groupBy: 'day' | 'week' | 'month'): Promise<(ProfitTotals & { period: string })[]> {
  const [agg, exp] = await Promise.all([
    db.execute<AggRow & { period: string }>(dsql`
      with per_order as (${perOrderCte(ctx)})
      select to_char(date_trunc(${groupBy}, local_at), 'YYYY-MM-DD') as period, ${AGG}
      from per_order group by 1 order by 1`),
    db.execute<{ period: string; total: number }>(dsql`
      select to_char(date_trunc(${groupBy}, e.spent_on::timestamp), 'YYYY-MM-DD') as period, coalesce(sum(e.amount), 0)::float as total
      from store_expenses e
      where e.store_id = ${ctx.storeId} and e.spent_on between ${ctx.startDay}::date and ${ctx.endDay}::date ${expensesScope(ctx.access)}
      group by 1`),
  ])
  const expBy = new Map([...exp].map((r) => [r.period, Number(r.total)]))
  const aggBy = new Map([...agg].map((r) => [r.period, r]))
  const periods = [...new Set([...aggBy.keys(), ...expBy.keys()])].sort()
  return periods.map((period) => ({ period, ...totalsFrom(aggBy.get(period), expBy.get(period) ?? 0) }))
}

/** Marge par produit : chiffre encaissé des lignes − prix d'achat − dépenses rattachées au produit. */
export async function productProfit(ctx: ProfitContext): Promise<Map<string, { revenueCollected: number; productCost: number; expenses: number; grossProfit: number; netProfit: number; unitsWithoutCost: number }>> {
  const scope = orderScope(ctx.access)
  const [lines, exp] = await Promise.all([
    db.execute<{ product_id: string; revenue: number; cost: number; missing: number }>(dsql`
      select oi.product_id,
             coalesce(sum(oi.total) filter (where ${orders.paymentStatus} = 'paid'), 0)::float as revenue,
             coalesce(sum(oi.quantity * ${LINE_COST}) filter (where ${orders.paymentStatus} = 'paid'), 0)::float as cost,
             coalesce(sum(oi.quantity) filter (where ${orders.paymentStatus} = 'paid' and ${LINE_COST} is null), 0)::int as missing
      from order_items oi
      join ${orders} on ${orders.id} = oi.order_id
      left join product_variants pv on pv.id = oi.variant_id
      left join products p on p.id = oi.product_id
      where ${orders.storeId} = ${ctx.storeId} and ${orders.createdAt} >= ${ctx.start.toISOString()}::timestamptz and ${orders.createdAt} < ${ctx.end.toISOString()}::timestamptz and oi.product_id is not null
        ${scope ? dsql`and ${scope}` : dsql``}
      group by oi.product_id`),
    db.execute<{ product_id: string; total: number }>(dsql`
      select e.product_id, coalesce(sum(e.amount), 0)::float as total from store_expenses e
      where e.store_id = ${ctx.storeId} and e.product_id is not null and e.spent_on between ${ctx.startDay}::date and ${ctx.endDay}::date ${expensesScope(ctx.access)}
      group by e.product_id`),
  ])
  const out = new Map<string, { revenueCollected: number; productCost: number; expenses: number; grossProfit: number; netProfit: number; unitsWithoutCost: number }>()
  const expBy = new Map([...exp].map((r) => [r.product_id, Number(r.total)]))
  for (const l of lines) {
    const e = expBy.get(l.product_id) ?? 0
    const gross = Number(l.revenue) - Number(l.cost)
    out.set(l.product_id, { revenueCollected: round(Number(l.revenue)), productCost: round(Number(l.cost)), expenses: round(e), grossProfit: round(gross), netProfit: round(gross - e), unitsWithoutCost: Number(l.missing) })
  }
  for (const [id, e] of expBy) if (!out.has(id)) out.set(id, { revenueCollected: 0, productCost: 0, expenses: round(e), grossProfit: 0, netProfit: round(-e), unitsWithoutCost: 0 })
  return out
}
