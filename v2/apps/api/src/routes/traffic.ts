/**
 * Trafic d'une boutique : visiteurs, provenance (canaux, campagnes, sites), appareils, pays,
 * produits, heures de pointe, parcours jusqu'à la commande et visiteurs en direct.
 * Source : page_events (collecte de la boutique) + commandes (conversion, chiffre).
 * Respecte le périmètre du membre (produits) et la visibilité du chiffre d'affaires.
 */
import { sql as dsql, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import type { AppEnv } from '../lib/context'
import { can, requirePermission } from '../lib/auth'
import { v } from '../lib/validate'
import { localMidnight } from './stats'

const querySchema = z.object({
  from: z.coerce.date().default(() => new Date(Date.now() - 29 * 86400_000)),
  to: z.coerce.date().default(() => new Date()),
  productId: z.string().max(40).optional(),
})

export const CHANNELS = ['facebook', 'instagram', 'tiktok', 'whatsapp', 'google', 'youtube', 'snapchat', 'telegram', 'x', 'search', 'email', 'sms', 'campaign', 'referral', 'direct'] as const
export type Channel = (typeof CHANNELS)[number]

const addDays = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10)

/** Domaine du référent, sans « www. ». */
const hostOf = (ref: SQL) => dsql`lower(substring(${ref} from '^[A-Za-z]+://(?:www\\.)?([^/:?#]+)'))`

/**
 * Canal d'une visite ou d'une commande, à partir des UTM puis du référent.
 * Même règle des deux côtés : les conversions par canal sont comparables aux visiteurs par canal.
 */
export function channelOf(utmSource: SQL, utmMedium: SQL, referrer: SQL): SQL {
  const s = dsql`lower(coalesce(${utmSource}, ''))`
  const m = dsql`lower(coalesce(${utmMedium}, ''))`
  const h = dsql`coalesce(${hostOf(referrer)}, '')`
  return dsql`case
    when ${s} ~ '(instagram|^ig$)' or ${h} ~ '(^|\\.)instagram\\.com$' then 'instagram'
    when ${s} ~ '(facebook|^fb$|^meta$|messenger)' or ${h} ~ '(^|\\.)(facebook\\.com|fb\\.com|fb\\.me|messenger\\.com)$' then 'facebook'
    when ${s} ~ 'tiktok' or ${h} ~ '(^|\\.)tiktok\\.com$' then 'tiktok'
    when ${s} ~ '(whatsapp|^wa$)' or ${h} ~ '((^|\\.)whatsapp\\.(com|net)$|^wa\\.me$)' then 'whatsapp'
    when ${s} ~ '(google|gads|adwords)' or ${h} ~ '(^|\\.)google\\.[a-z.]+$' then 'google'
    when ${s} ~ 'youtube' or ${h} ~ '((^|\\.)youtube\\.com$|^youtu\\.be$)' then 'youtube'
    when ${s} ~ 'snapchat' or ${h} ~ '(^|\\.)snapchat\\.com$' then 'snapchat'
    when ${s} ~ '(telegram|^tg$)' or ${h} ~ '((^|\\.)telegram\\.(org|me)$|^t\\.me$)' then 'telegram'
    when ${s} ~ '(twitter|^x$)' or ${h} ~ '(^|\\.)(twitter\\.com|x\\.com|t\\.co)$' then 'x'
    when ${s} ~ '(bing|yahoo|duckduckgo|ecosia|qwant)' or ${h} ~ '(^|\\.)(bing\\.com|yahoo\\.com|duckduckgo\\.com|ecosia\\.org|qwant\\.com)$' then 'search'
    when ${m} ~ '(e-?mail|newsletter)' or ${s} ~ '(e-?mail|newsletter|mailchimp|brevo|sendinblue)' then 'email'
    when ${m} = 'sms' or ${s} = 'sms' then 'sms'
    when ${s} <> '' then 'campaign'
    when ${h} <> '' then 'referral'
    else 'direct' end`
}

/** Pub payante : medium explicite (cpc, paid…) ou clic publicitaire Facebook/Google identifié. */
const paidOf = (utmMedium: SQL) => dsql`(lower(coalesce(${utmMedium}, '')) ~ '(cpc|ppc|cpm|paid|^ads?$|sponsor|display|retarget)')`

const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

export const trafficRoute = new Hono<AppEnv>().get('/traffic', requirePermission('stats.view'), v('query', querySchema), async (c) => {
  const store = c.get('store')
  const access = c.get('access')
  const revenueVisible = can(access, 'stats.revenue')
  const { from, to, productId } = c.req.valid('query')
  const tz = store.timezone
  const startDay = from.toISOString().slice(0, 10)
  const endDay = to.toISOString().slice(0, 10)
  const start = localMidnight(startDay, tz)
  const end = localMidnight(addDays(endDay, 1), tz)
  const span = end.getTime() - start.getTime()
  const prevStart = new Date(start.getTime() - span)
  const iso = (d: Date) => dsql`${d.toISOString()}::timestamptz`

  // Périmètre produits : celui du membre, éventuellement restreint à un produit choisi.
  let products: string[] | null = access.productIds ? [...access.productIds] : null
  if (productId) products = products ? products.filter((p) => p === productId) : [productId]
  const list = (ids: string[]) => dsql.join(ids.length ? ids.map((id) => dsql`${id}`) : [dsql`null`], dsql`, `)
  const evScope = products ? dsql`and e.product_id in (${list(products)})` : dsql``
  const orderScope = products ? dsql`and exists (select 1 from order_items oi where oi.order_id = o.id and oi.product_id in (${list(products)}))` : dsql``

  const evIn = (s: Date, e: Date) => dsql`e.store_id = ${store.id} and e.created_at >= ${iso(s)} and e.created_at < ${iso(e)} ${evScope}`
  // Commandes « web » uniquement : une commande saisie à la main n'est pas une conversion de visite.
  const ordIn = (s: Date, e: Date) => dsql`o.store_id = ${store.id} and o.created_at >= ${iso(s)} and o.created_at < ${iso(e)} and o.source <> 'manual' ${orderScope}`
  const paid = dsql`o.payment_status = 'paid'`
  const vid = dsql`coalesce(e.visitor_id, e.session_id)`

  // Première page vue de chaque visite : c'est elle qui porte la provenance.
  const sessions = dsql`(
    select distinct on (e.session_id) e.session_id, ${vid} as vid, e.referrer, e.utm_source, e.utm_medium, e.utm_campaign, e.device_type, e.country,
           ${channelOf(dsql`e.utm_source`, dsql`e.utm_medium`, dsql`e.referrer`)} as channel,
           ${paidOf(dsql`e.utm_medium`)} as is_paid
    from page_events e where ${evIn(start, end)} and e.event_type = 'page_view'
    order by e.session_id, e.created_at)`
  const orderChannel = channelOf(dsql`o.utm_source`, dsql`o.utm_medium`, dsql`o.referrer`)

  type Totals = { visitors: number; sessions: number; views: number; engaged: number }
  type OrderTotals = { orders: number; paid: number; revenue: number }
  const totals = (s: Date, e: Date) =>
    db
      .execute<Totals>(dsql`
        select count(distinct ${vid}) filter (where e.event_type = 'page_view')::int as visitors,
               count(distinct e.session_id) filter (where e.event_type = 'page_view')::int as sessions,
               count(*) filter (where e.event_type = 'page_view')::int as views,
               count(distinct e.session_id) filter (where e.event_type in ('scroll_50', 'cta_click', 'form_focus', 'checkout_initiate', 'whatsapp_click', 'video_play'))::int as engaged
        from page_events e where ${evIn(s, e)}`)
      .then((r) => r[0]!)
  const orderTotals = (s: Date, e: Date) =>
    db.execute<OrderTotals>(dsql`select count(*)::int as orders, count(*) filter (where ${paid})::int as paid, coalesce(sum(o.total) filter (where ${paid}), 0)::float as revenue from orders o where ${ordIn(s, e)}`).then((r) => r[0]!)

  const [cur, prev, curOrders, prevOrders, returning, daily, funnel, bySession, channelOrders, campaignOrders, productRows, hours, live] = await Promise.all([
    totals(start, end),
    totals(prevStart, start),
    orderTotals(start, end),
    orderTotals(prevStart, start),
    // Visiteurs déjà venus avant la période (même identifiant visiteur).
    db
      .execute<{ n: number }>(dsql`
        select count(distinct e.visitor_id)::int as n from page_events e
        where ${evIn(start, end)} and e.event_type = 'page_view' and e.visitor_id is not null
          and exists (select 1 from page_events p where p.store_id = ${store.id} and p.visitor_id = e.visitor_id and p.created_at < ${iso(start)})`)
      .then((r) => r[0]!.n),
    db.execute<{ day: string; visitors: number; views: number; orders: number }>(dsql`
      select to_char(d.day, 'YYYY-MM-DD') as day,
             coalesce(ev.visitors, 0)::int as visitors, coalesce(ev.views, 0)::int as views, coalesce(od.orders, 0)::int as orders
      from generate_series(${startDay}::date, ${endDay}::date, interval '1 day') as d(day)
      left join (
        select (e.created_at at time zone ${tz})::date as day, count(distinct ${vid})::int as visitors, count(*)::int as views
        from page_events e where ${evIn(start, end)} and e.event_type = 'page_view' group by 1
      ) ev on ev.day = d.day::date
      left join (
        select (o.created_at at time zone ${tz})::date as day, count(*)::int as orders from orders o where ${ordIn(start, end)} group by 1
      ) od on od.day = d.day::date
      order by d.day`),
    db
      .execute<{ visits: number; scrolled: number; clicked: number; started: number }>(dsql`
        select count(distinct e.session_id) filter (where e.event_type = 'page_view')::int as visits,
               count(distinct e.session_id) filter (where e.event_type in ('scroll_50', 'scroll_75', 'scroll_100'))::int as scrolled,
               count(distinct e.session_id) filter (where e.event_type in ('cta_click', 'whatsapp_click'))::int as clicked,
               count(distinct e.session_id) filter (where e.event_type in ('form_focus', 'checkout_initiate'))::int as started
        from page_events e where ${evIn(start, end)}`)
      .then((r) => r[0]!),
    // Visites calculées une seule fois, puis ventilées (canaux, campagnes, sites, appareils, pays) dans la même requête.
    db
      .execute<{
        channels: { channel: Channel; visitors: number; sessions: number; paid_visitors: number }[] | null
        campaigns: { source: string | null; medium: string | null; campaign: string; channel: Channel; visitors: number }[] | null
        referrers: { host: string; channel: Channel; visitors: number }[] | null
        devices: { device: string; visitors: number }[] | null
        countries: { country: string; visitors: number }[] | null
      }>(dsql`
        with s as materialized ${sessions}
        select
          (select json_agg(x order by x.visitors desc) from (
             select s.channel, count(distinct s.vid)::int as visitors, count(*)::int as sessions, count(distinct s.vid) filter (where s.is_paid)::int as paid_visitors
             from s group by 1) x) as channels,
          (select json_agg(x order by x.visitors desc) from (
             select s.utm_source as source, max(s.utm_medium) as medium, s.utm_campaign as campaign, min(s.channel) as channel, count(distinct s.vid)::int as visitors
             from s where coalesce(s.utm_campaign, '') <> '' group by s.utm_source, s.utm_campaign order by 5 desc limit 25) x) as campaigns,
          (select json_agg(x order by x.visitors desc) from (
             select ${hostOf(dsql`s.referrer`)} as host, min(s.channel) as channel, count(distinct s.vid)::int as visitors
             from s where ${hostOf(dsql`s.referrer`)} is not null group by 1 order by 3 desc limit 12) x) as referrers,
          (select json_agg(x order by x.visitors desc) from (
             select coalesce(s.device_type, 'unknown') as device, count(distinct s.vid)::int as visitors from s group by 1) x) as devices,
          (select json_agg(x order by x.visitors desc) from (
             select coalesce(nullif(s.country, ''), 'XX') as country, count(distinct s.vid)::int as visitors from s group by 1 order by 2 desc limit 15) x) as countries`)
      .then((r) => r[0]!),
    db.execute<{ channel: Channel; orders: number; revenue: number }>(dsql`
      select ${orderChannel} as channel, count(*)::int as orders, coalesce(sum(o.total) filter (where ${paid}), 0)::float as revenue
      from orders o where ${ordIn(start, end)} group by 1`),
    db.execute<{ source: string | null; campaign: string; orders: number; revenue: number }>(dsql`
      select o.utm_source as source, o.utm_campaign as campaign, count(*)::int as orders, coalesce(sum(o.total) filter (where ${paid}), 0)::float as revenue
      from orders o where ${ordIn(start, end)} and coalesce(o.utm_campaign, '') <> '' group by 1, 2`),
    db.execute<{ id: string; name: string; visitors: number; views: number; started: number; orders: number; revenue: number }>(dsql`
      with ev as (
        select e.product_id as id,
               count(distinct ${vid}) filter (where e.event_type = 'page_view')::int as visitors,
               count(*) filter (where e.event_type = 'page_view')::int as views,
               count(distinct e.session_id) filter (where e.event_type in ('form_focus', 'checkout_initiate'))::int as started
        from page_events e where ${evIn(start, end)} and e.product_id is not null group by 1
      ), od as (
        select oi.product_id as id, count(distinct o.id)::int as orders, coalesce(sum(oi.total) filter (where ${paid}), 0)::float as revenue
        from orders o join order_items oi on oi.order_id = o.id
        where ${ordIn(start, end)} and oi.product_id is not null ${products ? dsql`and oi.product_id in (${list(products)})` : dsql``}
        group by 1
      )
      select p.id, p.name, coalesce(ev.visitors, 0)::int as visitors, coalesce(ev.views, 0)::int as views, coalesce(ev.started, 0)::int as started,
             coalesce(od.orders, 0)::int as orders, coalesce(od.revenue, 0)::float as revenue
      from ev full join od on od.id = ev.id join products p on p.id = coalesce(ev.id, od.id)
      order by 3 desc, 6 desc limit 20`),
    db.execute<{ hour: number; visitors: number; orders: number }>(dsql`
      select h.hour::int as hour, coalesce(ev.visitors, 0)::int as visitors, coalesce(od.orders, 0)::int as orders
      from generate_series(0, 23) as h(hour)
      left join (
        select extract(hour from e.created_at at time zone ${tz})::int as hour, count(distinct e.session_id)::int as visitors
        from page_events e where ${evIn(start, end)} and e.event_type = 'page_view' group by 1
      ) ev on ev.hour = h.hour
      left join (
        select extract(hour from o.created_at at time zone ${tz})::int as hour, count(*)::int as orders from orders o where ${ordIn(start, end)} group by 1
      ) od on od.hour = h.hour
      order by 1`),
    // En direct : visiteurs actifs ces 5 dernières minutes (indépendant de la période).
    db
      .execute<{ n: number }>(dsql`
        select count(distinct ${vid})::int as n from page_events e
        where e.store_id = ${store.id} and e.created_at >= now() - interval '5 minutes' ${evScope}`)
      .then((r) => r[0]!.n),
  ])

  const money = (n: number) => (revenueVisible ? n : null)
  const channels = bySession.channels ?? []
  const campaigns = bySession.campaigns ?? []
  const referrers = bySession.referrers ?? []
  const devices = bySession.devices ?? []
  const countries = bySession.countries ?? []
  const byChannel = new Map(channelOrders.map((r) => [r.channel, r]))
  const channelRows = channels.map((r) => {
    const o = byChannel.get(r.channel)
    byChannel.delete(r.channel)
    return { channel: r.channel, visitors: r.visitors, sessions: r.sessions, paidVisitors: r.paid_visitors, orders: o?.orders ?? 0, revenue: money(o?.revenue ?? 0), conversion: rate(o?.orders ?? 0, r.visitors) }
  })
  // Canaux avec commandes mais sans visite suivie (bloqueur de pub, visite avant la période…).
  for (const o of byChannel.values()) channelRows.push({ channel: o.channel, visitors: 0, sessions: 0, paidVisitors: 0, orders: o.orders, revenue: money(o.revenue), conversion: null })

  const campKey = (s: string | null, c: string) => `${(s ?? '').toLowerCase()}|${c}`
  const campOrders = new Map(campaignOrders.map((r) => [campKey(r.source, r.campaign), r]))
  const campaignRows = campaigns.map((r) => {
    const o = campOrders.get(campKey(r.source, r.campaign))
    return { source: r.source, medium: r.medium, campaign: r.campaign, channel: r.channel, visitors: r.visitors, orders: o?.orders ?? 0, revenue: money(o?.revenue ?? 0), conversion: rate(o?.orders ?? 0, r.visitors) }
  })

  return c.json({
    range: { from: startDay, to: endDay },
    revenueVisible,
    live,
    current: { ...cur, returning, newVisitors: Math.max(cur.visitors - returning, 0), orders: curOrders.orders, paidOrders: curOrders.paid, revenue: money(curOrders.revenue), conversion: rate(curOrders.orders, cur.visitors), engagement: rate(cur.engaged, cur.sessions), viewsPerVisit: cur.sessions ? Math.round((cur.views / cur.sessions) * 10) / 10 : null },
    previous: { visitors: prev.visitors, sessions: prev.sessions, views: prev.views, orders: prevOrders.orders, revenue: money(prevOrders.revenue), conversion: rate(prevOrders.orders, prev.visitors) },
    daily,
    funnel: { visits: funnel.visits, scrolled: funnel.scrolled, clicked: funnel.clicked, started: funnel.started, ordered: curOrders.orders, paid: curOrders.paid },
    channels: channelRows,
    campaigns: campaignRows,
    referrers,
    devices,
    countries,
    products: productRows.map((p) => ({ ...p, revenue: money(p.revenue), conversion: rate(p.orders, p.visitors) })),
    hours,
  })
})
