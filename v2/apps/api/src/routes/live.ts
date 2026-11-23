/**
 * Vue en direct d'une boutique : qui est là maintenant, d'où, sur quel produit, où en est chaque visiteur
 * (page, formulaire, paiement, commande), plus le cumul du jour et le fil des derniers événements.
 * Pensée pour être rafraîchie toutes les quelques secondes : requêtes bornées aux dernières minutes / au jour.
 * Respecte le périmètre du membre (produits) et la visibilité du chiffre d'affaires.
 */
import { sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import type { AppEnv } from '../lib/context'
import { can, requirePermission } from '../lib/auth'
import { v } from '../lib/validate'
import { localMidnight } from './stats'
import { channelOf, type Channel } from './traffic'

/** Un visiteur est « là » s'il a fait quelque chose ces 5 dernières minutes (même règle que Shopify et GA). */
const ACTIVE_MIN = 5
/** Fil d'activité et commandes affichées sur le globe : la dernière demi-heure. */
const FEED_MIN = 30

const todayIn = (tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

type Point = { lat: number; lon: number; city: string | null; country: string | null; visitors: number }
type FeedRow = { kind: 'visit' | 'form' | 'payment' | 'order'; at: string; city: string | null; country: string | null; product: string | null; channel: Channel | null; name: string | null; total: number | null }

export const liveRoute = new Hono<AppEnv>().get('/live', requirePermission('stats.view'), v('query', z.object({ productId: z.string().max(40).optional() })), async (c) => {
  const store = c.get('store')
  const access = c.get('access')
  const revenueVisible = can(access, 'stats.revenue')
  const { productId } = c.req.valid('query')
  const tz = store.timezone
  const dayStart = localMidnight(todayIn(tz), tz)
  const iso = (d: Date) => dsql`${d.toISOString()}::timestamptz`

  let products: string[] | null = access.productIds ? [...access.productIds] : null
  if (productId) products = products ? products.filter((p) => p === productId) : [productId]
  const list = (ids: string[]) => dsql.join(ids.length ? ids.map((id) => dsql`${id}`) : [dsql`null`], dsql`, `)
  const evScope = products ? dsql`and e.product_id in (${list(products)})` : dsql``
  const orderScope = products ? dsql`and exists (select 1 from order_items oi where oi.order_id = o.id and oi.product_id in (${list(products)}))` : dsql``
  const vid = dsql`coalesce(e.visitor_id, e.session_id)`
  const active = dsql`e.store_id = ${store.id} and e.created_at >= now() - interval '${dsql.raw(String(ACTIVE_MIN))} minutes' ${evScope}`
  const ordToday = dsql`o.store_id = ${store.id} and o.created_at >= ${iso(dayStart)} and o.source <> 'manual' ${orderScope}`

  const [now, today, series, locations, feed, orderPins] = await Promise.all([
    // Maintenant : chaque visiteur actif, son étape la plus avancée, sa position, son produit et sa provenance.
    db
      .execute<{ visitors: number; stages: { browsing: number; form: number; payment: number; ordered: number }; points: Point[] | null; products: { id: string; name: string; visitors: number }[] | null; channels: { channel: Channel; visitors: number }[] | null }>(dsql`
        with ev as materialized (
          select ${vid} as vid, e.session_id, e.event_type, e.product_id, e.created_at, e.city, e.country, e.latitude, e.longitude,
                 e.utm_source, e.utm_medium, e.referrer
          from page_events e where ${active}
        ),
        v as (
          select vid,
                 bool_or(event_type in ('order_created', 'payment_completed')) or exists (
                   select 1 from orders o
                   where o.store_id = ${store.id} and o.created_at >= now() - interval '15 minutes'
                     and (o.visitor_id = ev.vid or o.session_id = any(array_agg(ev.session_id)))
                 ) as ordered,
                 bool_or(event_type = 'payment_started') as payment,
                 bool_or(event_type in ('form_focus', 'checkout_initiate')) as form,
                 (array_agg(product_id order by created_at desc) filter (where product_id is not null))[1] as product_id,
                 (array_agg(latitude order by created_at desc) filter (where latitude is not null))[1] as lat,
                 (array_agg(longitude order by created_at desc) filter (where latitude is not null))[1] as lon,
                 (array_agg(city order by created_at desc) filter (where latitude is not null))[1] as city,
                 (array_agg(country order by created_at desc) filter (where country is not null))[1] as country
          from ev group by vid
        ),
        -- Provenance : la page d'arrivée de la visite en cours (pas forcément dans les 5 dernières minutes).
        land as (
          select distinct on (e.session_id) e.session_id, ${channelOf(dsql`e.utm_source`, dsql`e.utm_medium`, dsql`e.referrer`)} as channel
          from page_events e
          where e.store_id = ${store.id} and e.event_type = 'page_view' and e.created_at >= now() - interval '6 hours'
            and e.session_id in (select session_id from ev)
          order by e.session_id, e.created_at
        ),
        vc as (
          select distinct on (ev.vid) ev.vid, land.channel from ev join land on land.session_id = ev.session_id order by ev.vid, ev.created_at desc
        )
        select
          (select count(*)::int from v) as visitors,
          json_build_object(
            'ordered', (select count(*)::int from v where ordered),
            'payment', (select count(*)::int from v where payment and not ordered),
            'form', (select count(*)::int from v where form and not payment and not ordered),
            'browsing', (select count(*)::int from v where not form and not payment and not ordered)
          ) as stages,
          (select json_agg(p order by p.visitors desc) from (
             select lat, lon, max(city) as city, max(country) as country, count(*)::int as visitors
             from v where lat is not null group by lat, lon) p) as points,
          (select json_agg(x order by x.visitors desc) from (
             select p.id, p.name, count(*)::int as visitors from v join products p on p.id = v.product_id group by p.id, p.name order by 3 desc limit 6) x) as products,
          (select json_agg(x order by x.visitors desc) from (
             select channel, count(*)::int as visitors from vc group by channel order by 2 desc limit 6) x) as channels`)
      .then((r) => r[0]!),
    // Aujourd'hui (heure de la boutique).
    db
      .execute<{ visitors: number; sessions: number; orders: number; revenue: number }>(dsql`
        select
          (select count(distinct ${vid})::int from page_events e where e.store_id = ${store.id} and e.created_at >= ${iso(dayStart)} ${evScope}) as visitors,
          (select count(distinct e.session_id)::int from page_events e where e.store_id = ${store.id} and e.created_at >= ${iso(dayStart)} and e.event_type = 'page_view' ${evScope}) as sessions,
          (select count(*)::int from orders o where ${ordToday}) as orders,
          (select coalesce(sum(o.total), 0)::bigint from orders o where ${ordToday} and o.payment_status = 'paid') as revenue`)
      .then((r) => ({ ...r[0]!, revenue: Number(r[0]!.revenue) })),
    // Courbes du jour, heure par heure (pour les mini-graphiques).
    db.execute<{ hour: number; sessions: number; orders: number; revenue: number }>(dsql`
      select h.hour, coalesce(ev.sessions, 0)::int as sessions, coalesce(od.orders, 0)::int as orders, coalesce(od.revenue, 0)::bigint as revenue
      from generate_series(0, 23) as h(hour)
      left join (
        select extract(hour from e.created_at at time zone ${tz})::int as hour, count(distinct e.session_id)::int as sessions
        from page_events e where e.store_id = ${store.id} and e.created_at >= ${iso(dayStart)} and e.event_type = 'page_view' ${evScope} group by 1
      ) ev on ev.hour = h.hour
      left join (
        select extract(hour from o.created_at at time zone ${tz})::int as hour, count(*)::int as orders,
               sum(case when o.payment_status = 'paid' then o.total else 0 end) as revenue
        from orders o where ${ordToday} group by 1
      ) od on od.hour = h.hour
      order by 1`),
    // Visites du jour par lieu (ville, à défaut pays).
    db.execute<{ city: string | null; country: string | null; sessions: number }>(dsql`
      select max(e.city) as city, e.country, count(distinct e.session_id)::int as sessions
      from page_events e
      where e.store_id = ${store.id} and e.created_at >= ${iso(dayStart)} and e.event_type = 'page_view' ${evScope}
      group by e.country, coalesce(e.city, '')
      order by 3 desc limit 8`),
    // Fil : arrivées (première page de chaque visite), formulaires, paiements, commandes.
    db.execute<FeedRow & { total: number }>(dsql`
      select * from (
        (select case e.event_type when 'page_view' then 'visit' when 'payment_started' then 'payment' else 'form' end as kind,
                e.created_at as at, e.city, e.country, p.name as product,
                case when e.event_type = 'page_view' then ${channelOf(dsql`e.utm_source`, dsql`e.utm_medium`, dsql`e.referrer`)} end as channel,
                null::text as name, null::bigint as total
         from (
           select distinct on (e.session_id, e.event_type) e.* from page_events e
           where e.store_id = ${store.id} and e.created_at >= now() - interval '${dsql.raw(String(FEED_MIN))} minutes'
             and e.event_type in ('page_view', 'checkout_initiate', 'payment_started') ${evScope}
           order by e.session_id, e.event_type, e.created_at
         ) e left join products p on p.id = e.product_id
         order by e.created_at desc limit 25)
        union all
        (select 'order', o.created_at, o.city, null, (select oi.name from order_items oi where oi.order_id = o.id order by oi.id limit 1), null,
                nullif(split_part(trim(coalesce(o.customer_name, '')), ' ', 1), ''), o.total
         from orders o where o.store_id = ${store.id} and o.created_at >= now() - interval '${dsql.raw(String(FEED_MIN))} minutes' and o.source <> 'manual' ${orderScope}
         order by o.created_at desc limit 10)
      ) f order by at desc limit 25`),
    // Commandes de la dernière demi-heure, placées sur le globe à la position de la visite de l'acheteur.
    db.execute<{ lat: number; lon: number; city: string | null; at: string }>(dsql`
      select g.latitude as lat, g.longitude as lon, coalesce(g.city, o.city) as city, o.created_at as at
      from orders o
      join lateral (
        select e.latitude, e.longitude, e.city from page_events e
        where e.store_id = ${store.id} and e.latitude is not null
          and (e.session_id = o.session_id or (o.visitor_id is not null and e.visitor_id = o.visitor_id))
          and e.created_at <= o.created_at + interval '5 minutes'
        order by e.created_at desc limit 1
      ) g on true
      where o.store_id = ${store.id} and o.created_at >= now() - interval '${dsql.raw(String(FEED_MIN))} minutes' and o.source <> 'manual' ${orderScope}
      order by o.created_at desc limit 20`),
  ])

  const money = (n: number) => (revenueVisible ? n : null)
  return c.json({
    revenueVisible,
    currency: store.currency,
    country: store.country,
    serverTime: new Date().toISOString(),
    now: {
      visitors: now.visitors,
      stages: now.stages,
      points: now.points ?? [],
      products: now.products ?? [],
      channels: now.channels ?? [],
    },
    today: {
      ...today,
      revenue: money(today.revenue),
      series: series.map((s) => ({ hour: s.hour, sessions: s.sessions, orders: s.orders, revenue: money(Number(s.revenue)) })),
      locations,
    },
    feed: feed.map((f) => ({ ...f, total: f.kind === 'order' ? money(Number(f.total)) : null })),
    orders: orderPins,
  })
})
