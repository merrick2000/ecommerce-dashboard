/**
 * Super admin : vue d'ensemble de la plateforme (comptes, inscriptions, provenance, boutiques, commandes,
 * abonnements) et réglages globaux. Réservé aux comptes isPlatformAdmin.
 */
import { effectivePlan, PLAN_IDS, type PlanId } from '@zuri/shared'
import { and, desc, eq, ilike, inArray, isNotNull, or, sql as dsql, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { z } from 'zod'
import { db } from '../db/client'
import { billingPayments, orders, paymentAccounts, sessions, storeMembers, stores, subscriptions, users } from '../db/schema'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'
import { v } from '../lib/validate'
import { extendSubscription } from '../services/billing'
import { getSetting, setSetting } from '../services/platform'
import { decrypt, encrypt } from '../lib/crypto'
import { env } from '../lib/env'
import { resetFirecrawlKeyCache } from '../services/page-fetch'

const requirePlatformAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('user').isPlatformAdmin) throw new HttpError(404, 'Route introuvable', 'not_found')
  await next()
})

const page = z.object({ q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(50) })
const like = (q: string) => `%${q.replace(/[%_]/g, '\\$&')}%`
const n = (x: unknown) => Number(x ?? 0)

/** Libellé lisible de la provenance d'une inscription. */
function sourceLabel(s: Record<string, string | undefined> | null | undefined) {
  if (!s) return 'Inconnue'
  if (s.utmSource) return `${s.utmSource}${s.utmMedium ? ` / ${s.utmMedium}` : ''}`
  if (s.referrer) return s.referrer.replace(/^www\./, '')
  if (s.method === 'invite') return 'Invitation d’équipe'
  if (s.landing || s.from) return 'Direct'
  return 'Inconnue'
}

export const adminRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePlatformAdmin)
  .get('/overview', async (c) => {
    const [u] = await db.select({ total: dsql`count(*)`, d7: dsql`count(*) filter (where created_at > now() - interval '7 days')`, d30: dsql`count(*) filter (where created_at > now() - interval '30 days')`, today: dsql`count(*) filter (where created_at::date = now()::date)`, active7: dsql`count(*) filter (where last_login_at > now() - interval '7 days')` }).from(users)
    const [s] = await db.select({ total: dsql`count(*)`, active: dsql`count(*) filter (where status = 'active')`, paused: dsql`count(*) filter (where status = 'paused')`, closed: dsql`count(*) filter (where status = 'closed')` }).from(stores)
    const [o] = await db
      .select({
        total: dsql`count(*)`,
        d30: dsql`count(*) filter (where created_at > now() - interval '30 days')`,
        today: dsql`count(*) filter (where created_at::date = now()::date)`,
        delivered30: dsql`coalesce(sum(total) filter (where fulfillment_status = 'delivered' and created_at > now() - interval '30 days'), 0)`,
        storesWithOrders: dsql`count(distinct store_id)`,
      })
      .from(orders)
    const signups = await db.execute(dsql`select to_char(d, 'YYYY-MM-DD') as day, coalesce(c, 0)::int as count from generate_series(now()::date - 29, now()::date, '1 day') d left join (select created_at::date as day, count(*) c from users group by 1) x on x.day = d order by d`)
    const ordersDaily = await db.execute(dsql`select to_char(d, 'YYYY-MM-DD') as day, coalesce(c, 0)::int as count from generate_series(now()::date - 29, now()::date, '1 day') d left join (select created_at::date as day, count(*) c from orders group by 1) x on x.day = d order by d`)
    const srcRows = await db.select({ s: users.signupSource }).from(users)
    const sources = new Map<string, number>()
    const landings = new Map<string, number>()
    for (const r of srcRows) {
      const k = sourceLabel(r.s as never)
      sources.set(k, (sources.get(k) ?? 0) + 1)
      const l = (r.s as { from?: string; landing?: string } | null)?.from ?? (r.s as { landing?: string } | null)?.landing
      if (l) landings.set(l, (landings.get(l) ?? 0) + 1)
    }
    const top = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([label, count]) => ({ label, count }))
    const [b] = await db.select({ paid: dsql`coalesce(sum(amount) filter (where status = 'paid'), 0)`, count: dsql`count(*) filter (where status = 'paid')` }).from(billingPayments)
    const subs = await db.select({ plan: subscriptions.plan, n: dsql<number>`count(*)::int` }).from(subscriptions).where(dsql`${subscriptions.currentPeriodEnd} > now()`).groupBy(subscriptions.plan)
    return c.json({
      users: { total: n(u?.total), today: n(u?.today), d7: n(u?.d7), d30: n(u?.d30), active7: n(u?.active7) },
      stores: { total: n(s?.total), active: n(s?.active), paused: n(s?.paused), closed: n(s?.closed), withOrders: n(o?.storesWithOrders) },
      orders: { total: n(o?.total), today: n(o?.today), d30: n(o?.d30), delivered30: n(o?.delivered30) },
      billing: { revenue: n(b?.paid), payments: n(b?.count), subscriptions: subs },
      signups: signups as unknown as { day: string; count: number }[],
      ordersDaily: ordersDaily as unknown as { day: string; count: number }[],
      sources: top(sources),
      landings: top(landings),
      umamiUrl: 'https://cloud.umami.is',
    })
  })
  .get('/users', v('query', page), async (c) => {
    const q = c.req.valid('query')
    const where: SQL | undefined = q.q ? or(ilike(users.email, like(q.q)), ilike(users.name, like(q.q)), ilike(users.phone, like(q.q))) : undefined
    const [{ total } = { total: 0 }] = await db.select({ total: dsql<number>`count(*)::int` }).from(users).where(where)
    const rows = await db
      .select({
        user: users,
        stores: dsql<number>`(select count(*)::int from ${storeMembers} m join ${stores} s on s.id = m.store_id where m.user_id = "users"."id" and m.role = 'owner')`,
        orders: dsql<number>`(select count(*)::int from ${orders} o join ${storeMembers} m on m.store_id = o.store_id where m.user_id = "users"."id" and m.role = 'owner')`,
        subPlan: subscriptions.plan,
        subEnd: subscriptions.currentPeriodEnd,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize)
    return c.json({
      total,
      page: q.page,
      pageSize: q.pageSize,
      data: rows.map(({ user: x, stores: st, orders: od, subPlan, subEnd }) => ({
        id: x.id,
        email: x.email,
        name: x.name,
        phone: x.phone,
        country: x.country,
        isPlatformAdmin: x.isPlatformAdmin,
        createdAt: x.createdAt,
        lastLoginAt: x.lastLoginAt,
        disabled: Boolean(x.disabledAt),
        features: x.features ?? {},
        signupSource: x.signupSource,
        sourceLabel: sourceLabel(x.signupSource as never),
        stores: st,
        orders: od,
        plan: effectivePlan({ createdAt: x.createdAt, subscription: subPlan && subEnd ? { plan: subPlan, currentPeriodEnd: subEnd } : null }),
      })),
    })
  })
  .get('/users/:id', v('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    const id = c.req.valid('param').id
    const [x] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!x) throw new HttpError(404, 'Compte introuvable', 'not_found')
    const ownStores = await db.select({ id: stores.id, name: stores.name, slug: stores.slug, status: stores.status, role: storeMembers.role, createdAt: stores.createdAt }).from(storeMembers).innerJoin(stores, eq(stores.id, storeMembers.storeId)).where(eq(storeMembers.userId, id))
    const payments = await db.select().from(billingPayments).where(eq(billingPayments.userId, id)).orderBy(desc(billingPayments.createdAt)).limit(20)
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, id)).limit(1)
    const { passwordHash, ...safe } = x
    return c.json({ user: safe, stores: ownStores, payments, subscription: sub ?? null, plan: effectivePlan({ createdAt: x.createdAt, subscription: sub ?? null }) })
  })
  .patch('/users/:id', v('param', z.object({ id: z.coerce.number().int() })), v('json', z.object({ disabled: z.boolean().optional(), features: z.record(z.string(), z.boolean()).optional() })), async (c) => {
    const id = c.req.valid('param').id
    const body = c.req.valid('json')
    if (id === c.get('user').id && body.disabled) throw new HttpError(400, 'Tu ne peux pas suspendre ton propre compte', 'self')
    const patch: Partial<typeof users.$inferInsert> = {}
    if (body.disabled !== undefined) patch.disabledAt = body.disabled ? new Date() : null
    if (body.features) patch.features = body.features
    await db.update(users).set(patch).where(eq(users.id, id))
    if (body.disabled) await db.delete(sessions).where(eq(sessions.userId, id))
    return c.json({ ok: true })
  })
  /** Offrir ou retirer une formule à un compte. */
  .post('/users/:id/subscription', v('param', z.object({ id: z.coerce.number().int() })), v('json', z.object({ plan: z.enum(PLAN_IDS), months: z.number().int().min(1).max(36), note: z.string().max(300).optional() })), async (c) => {
    const { plan, months, note } = c.req.valid('json')
    const end = await extendSubscription(c.req.valid('param').id, plan as PlanId, months, 'offered', note ?? 'Offert par l’administration')
    return c.json({ currentPeriodEnd: end })
  })
  .delete('/users/:id/subscription', v('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    await db.delete(subscriptions).where(eq(subscriptions.userId, c.req.valid('param').id))
    return c.json({ ok: true })
  })
  .get('/stores', v('query', page.extend({ status: z.enum(['active', 'paused', 'closed']).optional() })), async (c) => {
    const q = c.req.valid('query')
    const conds: SQL[] = []
    if (q.q) conds.push(or(ilike(stores.name, like(q.q)), ilike(stores.slug, like(q.q)))!)
    if (q.status) conds.push(eq(stores.status, q.status))
    const where = conds.length ? and(...conds) : undefined
    const [{ total } = { total: 0 }] = await db.select({ total: dsql<number>`count(*)::int` }).from(stores).where(where)
    const rows = await db
      .select({
        store: { id: stores.id, name: stores.name, slug: stores.slug, status: stores.status, country: stores.country, currency: stores.currency, createdAt: stores.createdAt },
        owner: dsql<string>`(select u.email from ${storeMembers} m join ${users} u on u.id = m.user_id where m.store_id = "stores"."id" and m.role = 'owner' limit 1)`,
        orders: dsql<number>`(select count(*)::int from ${orders} o where o.store_id = "stores"."id")`,
        orders30: dsql<number>`(select count(*)::int from ${orders} o where o.store_id = "stores"."id" and o.created_at > now() - interval '30 days')`,
        delivered: dsql<number>`(select coalesce(sum(o.total), 0)::float from ${orders} o where o.store_id = "stores"."id" and o.fulfillment_status = 'delivered')`,
        lastOrderAt: dsql<string>`(select max(o.created_at) from ${orders} o where o.store_id = "stores"."id")`,
        products: dsql<number>`(select count(*)::int from products p where p.store_id = "stores"."id")`,
        payments: dsql<string>`(select string_agg(pa.provider, ', ') from ${paymentAccounts} pa where pa.store_id = "stores"."id" and pa.enabled)`,
      })
      .from(stores)
      .where(where)
      .orderBy(desc(stores.createdAt))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize)
    return c.json({ total, page: q.page, pageSize: q.pageSize, data: rows.map((r) => ({ ...r.store, owner: r.owner, orders: r.orders, orders30: r.orders30, delivered: Number(r.delivered), lastOrderAt: r.lastOrderAt, products: r.products, payments: r.payments })) })
  })
  .post('/stores/:id/status', v('param', z.object({ id: z.string().max(40) })), v('json', z.object({ status: z.enum(['active', 'paused', 'closed']) })), async (c) => {
    const { status } = c.req.valid('json')
    const now = new Date()
    await db
      .update(stores)
      .set({ status, pausedAt: status === 'paused' ? now : null, closedAt: status === 'closed' ? now : null })
      .where(eq(stores.id, c.req.valid('param').id))
    return c.json({ ok: true })
  })
  .get('/billing-payments', async (c) => {
    const rows = await db.select({ p: billingPayments, email: users.email }).from(billingPayments).innerJoin(users, eq(users.id, billingPayments.userId)).orderBy(desc(billingPayments.createdAt)).limit(200)
    return c.json(rows.map((r) => ({ ...r.p, email: r.email })))
  })
  .get('/settings', async (c) => {
    const me = c.get('user')
    const myStores = await db.select({ id: stores.id, name: stores.name }).from(storeMembers).innerJoin(stores, eq(stores.id, storeMembers.storeId)).where(and(eq(storeMembers.userId, me.id), eq(storeMembers.role, 'owner')))
    const accounts = myStores.length ? await db.select({ storeId: paymentAccounts.storeId, provider: paymentAccounts.provider, enabled: paymentAccounts.enabled, mode: paymentAccounts.mode }).from(paymentAccounts).where(inArray(paymentAccounts.storeId, myStores.map((s) => s.id))) : []
    return c.json({
      paymentsOnline: await getSetting('payments.online', false),
      billingEnabled: await getSetting('billing.enabled', false),
      billingAccount: await getSetting<{ storeId?: string } | null>('billing.account', null),
      urlImport: await getSetting('import.url', false),
      firecrawl: await (async () => {
        const stored = await getSetting<string | null>('firecrawl.key', null)
        const key = stored ? decrypt(stored) : (env.FIRECRAWL_API_KEY ?? null)
        return { configured: Boolean(key), source: stored ? 'admin' : key ? 'env' : null, hint: key ? `${key.slice(0, 5)}…${key.slice(-4)}` : null }
      })(),
      myStores: myStores.map((s) => ({ ...s, accounts: accounts.filter((a) => a.storeId === s.id && ['fedapay', 'feexpay', 'pawapay'].includes(a.provider)) })),
    })
  })
  .put('/settings', v('json', z.object({ paymentsOnline: z.boolean().optional(), billingEnabled: z.boolean().optional(), billingStoreId: z.string().max(40).nullable().optional(), urlImport: z.boolean().optional(), firecrawlKey: z.string().trim().regex(/^fc-[A-Za-z0-9]{16,80}$/, 'Clé Firecrawl invalide (fc-…)').nullable().optional() })), async (c) => {
    const body = c.req.valid('json')
    if (body.urlImport !== undefined) await setSetting('import.url', body.urlImport)
    if (body.firecrawlKey !== undefined) {
      await setSetting('firecrawl.key', body.firecrawlKey ? encrypt(body.firecrawlKey) : null)
      resetFirecrawlKeyCache()
    }
    if (body.paymentsOnline !== undefined) await setSetting('payments.online', body.paymentsOnline)
    if (body.billingEnabled !== undefined) await setSetting('billing.enabled', body.billingEnabled)
    if (body.billingStoreId !== undefined) await setSetting('billing.account', body.billingStoreId ? { storeId: body.billingStoreId } : null)
    return c.json({ ok: true })
  })

export { isNotNull }
