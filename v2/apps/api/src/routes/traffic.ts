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

  /**
   * Attribution des commandes web : on retrouve toutes les visites de l'acheteur (même visiteur ou même visite)
   * dans les 30 jours avant la commande.
   * - Premier clic : la toute première visite (ce qui a fait découvrir la boutique).
   * - Dernier clic : la dernière visite qui n'est pas un accès direct (ce qui a déclenché l'achat).
   * Sans visite retrouvée (bloqueur, ancienne commande), on garde la provenance enregistrée sur la commande.
   */
  type Attr = { channel: Channel; orders: number; revenue: number }
  type AttrCamp = { source: string | null; campaign: string; orders: number; revenue: number }
  const touch = dsql`(t.vid = o.vid or t.session_id = o.session_id) and t.created_at <= o.created_at and t.created_at >= o.created_at - interval '30 days'`
  const attribution = db
    .execute<{
      first_channels: Attr[] | null
      last_channels: Attr[] | null
      first_campaigns: AttrCamp[] | null
      last_campaigns: AttrCamp[] | null
      journey: { orders: number; tracked: number; multi_visit: number; switched: number; avg_visits: number | null; avg_hours: number | null }
    }>(dsql`
      with o as materialized (
        select o.id, o.total, (${paid}) as is_paid, o.created_at, o.session_id,
               coalesce(o.visitor_id, (select e.visitor_id from page_events e where e.store_id = ${store.id} and e.session_id = o.session_id and e.visitor_id is not null limit 1)) as vid,
               ${orderChannel} as own_channel, o.utm_source as own_source, o.utm_campaign as own_campaign
        from orders o where ${ordIn(start, end)}
      ),
      t as materialized (
        select distinct on (e.session_id) e.session_id, e.visitor_id as vid, e.created_at, e.utm_source, e.utm_campaign,
               ${channelOf(dsql`e.utm_source`, dsql`e.utm_medium`, dsql`e.referrer`)} as channel
        from page_events e
        where e.store_id = ${store.id} and e.event_type = 'page_view'
          and e.created_at >= ${iso(start)} - interval '30 days' and e.created_at < ${iso(end)}
          and (e.visitor_id in (select vid from o where vid is not null) or e.session_id in (select session_id from o where session_id is not null))
        order by e.session_id, e.created_at
      ),
      a as (
        select o.*, f.channel as f_channel, f.utm_source as f_source, f.utm_campaign as f_campaign, f.created_at as f_at,
               l.channel as l_channel, l.utm_source as l_source, l.utm_campaign as l_campaign,
               (select count(*) from t where ${touch})::int as visits
        from o
        left join lateral (select * from t where ${touch} order by t.created_at limit 1) f on true
        left join lateral (select * from t where ${touch} order by (t.channel <> 'direct') desc, t.created_at desc limit 1) l on true
      ),
      m as (
        select a.*,
               coalesce(f_channel, own_channel) as first_channel, coalesce(l_channel, own_channel) as last_channel,
               case when f_channel is null then own_source else f_source end as first_source,
               case when f_channel is null then own_campaign else f_campaign end as first_campaign,
               case when l_channel is null then own_source else l_source end as last_source,
               case when l_channel is null then own_campaign else l_campaign end as last_campaign
        from a
      )
      select
        (select json_agg(x) from (select first_channel as channel, count(*)::int as orders, coalesce(sum(total) filter (where is_paid), 0)::float as revenue from m group by 1) x) as first_channels,
        (select json_agg(x) from (select last_channel as channel, count(*)::int as orders, coalesce(sum(total) filter (where is_paid), 0)::float as revenue from m group by 1) x) as last_channels,
        (select json_agg(x) from (select first_source as source, first_campaign as campaign, count(*)::int as orders, coalesce(sum(total) filter (where is_paid), 0)::float as revenue from m where coalesce(first_campaign, '') <> '' group by 1, 2) x) as first_campaigns,
        (select json_agg(x) from (select last_source as source, last_campaign as campaign, count(*)::int as orders, coalesce(sum(total) filter (where is_paid), 0)::float as revenue from m where coalesce(last_campaign, '') <> '' group by 1, 2) x) as last_campaigns,
        (select json_build_object(
           'orders', count(*),
           'tracked', count(*) filter (where f_channel is not null),
           'multi_visit', count(*) filter (where visits > 1),
           'switched', count(*) filter (where f_channel is not null and first_channel <> last_channel),
           'avg_visits', round(avg(visits) filter (where visits > 0), 1),
           'avg_hours', round((avg(extract(epoch from created_at - f_at)) filter (where f_at is not null) / 3600)::numeric, 1)
         ) from m) as journey`)
    .then((r) => r[0]!)

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

  const [cur, prev, curOrders, prevOrders, returning, daily, funnel, bySession, attr, productRows, hours, live] = await Promise.all([
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
    attribution,
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
  const pick = <T extends { orders: number; revenue: number }>(rows: T[] | null, key: (r: T) => string) => new Map((rows ?? []).map((r) => [key(r), r]))
  const firstCh = pick(attr.first_channels, (r) => r.channel)
  const lastCh = pick(attr.last_channels, (r) => r.channel)
  const outcome = (f: { orders: number; revenue: number } | undefined, l: { orders: number; revenue: number } | undefined, visitors: number) => ({
    // Par défaut : dernier clic (ce qui a déclenché l'achat). Le premier clic est donné à côté.
    orders: l?.orders ?? 0,
    revenue: money(l?.revenue ?? 0),
    conversion: rate(l?.orders ?? 0, visitors),
    first: { orders: f?.orders ?? 0, revenue: money(f?.revenue ?? 0), conversion: rate(f?.orders ?? 0, visitors) },
  })
  const seen = new Set<string>()
  const channelRows = channels.map((r) => {
    seen.add(r.channel)
    return { channel: r.channel, visitors: r.visitors, sessions: r.sessions, paidVisitors: r.paid_visitors, ...outcome(firstCh.get(r.channel), lastCh.get(r.channel), r.visitors) }
  })
  // Canaux avec commandes mais sans visite sur la période (visite le mois d'avant, bloqueur de pub…).
  for (const ch of new Set([...firstCh.keys(), ...lastCh.keys()]))
    if (!seen.has(ch)) channelRows.push({ channel: ch as Channel, visitors: 0, sessions: 0, paidVisitors: 0, ...outcome(firstCh.get(ch), lastCh.get(ch), 0), conversion: null })

  const campKey = (s: string | null, c: string) => `${(s ?? '').toLowerCase()}|${c}`
  const firstCamp = pick(attr.first_campaigns, (r) => campKey(r.source, r.campaign))
  const lastCamp = pick(attr.last_campaigns, (r) => campKey(r.source, r.campaign))
  const campaignRows = campaigns.map((r) => {
    const k = campKey(r.source, r.campaign)
    return { source: r.source, medium: r.medium, campaign: r.campaign, channel: r.channel, visitors: r.visitors, ...outcome(firstCamp.get(k), lastCamp.get(k), r.visitors) }
  })
  const j = attr.journey
  const journey = {
    orders: j.orders,
    tracked: j.tracked,
    multiVisit: j.multi_visit,
    switched: j.switched,
    avgVisits: j.avg_visits != null ? Number(j.avg_visits) : null,
    avgHours: j.avg_hours != null ? Number(j.avg_hours) : null,
  }

  return c.json({
    range: { from: startDay, to: endDay },
    revenueVisible,
    live,
    current: { ...cur, returning, newVisitors: Math.max(cur.visitors - returning, 0), orders: curOrders.orders, paidOrders: curOrders.paid, revenue: money(curOrders.revenue), conversion: rate(curOrders.orders, cur.visitors), engagement: rate(cur.engaged, cur.sessions), viewsPerVisit: cur.sessions ? Math.round((cur.views / cur.sessions) * 10) / 10 : null },
    previous: { visitors: prev.visitors, sessions: prev.sessions, views: prev.views, orders: prevOrders.orders, revenue: money(prevOrders.revenue), conversion: rate(prevOrders.orders, prev.visitors) },
    daily,
    funnel: { visits: funnel.visits, scrolled: funnel.scrolled, clicked: funnel.clicked, started: funnel.started, ordered: curOrders.orders, paid: curOrders.paid },
    attribution: journey,
    channels: channelRows,
    campaigns: campaignRows,
    referrers,
    devices,
    countries,
    products: productRows.map((p) => ({ ...p, revenue: money(p.revenue), conversion: rate(p.orders, p.visitors) })),
    hours,
  })
})
