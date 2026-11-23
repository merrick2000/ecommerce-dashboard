import {
  FULFILLMENT_TRANSITIONS,
  manualOrderCreateSchema,
  orderListQuerySchema,
  orderNoteSchema,
  orderPaymentUpdateSchema,
  orderStatusUpdateSchema,
  orderIdSchema,
  orderAssignSchema,
} from '@zuri/shared'
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, or, sql as dsql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { customers, deliveryZones, downloads, orderEvents, orderItems, orders, paymentTransactions, productVariants, products, storeMembers, users, type Order } from '../db/schema'
import { customerMailOpts, emailOrder, loadOrder, orderUrl } from '../jobs/handlers'
import { customerDigitalEmail, customerPaymentReminderEmail } from '../services/order-emails'
import { sendEmail } from '../services/notify'
import { can, loadAccess, requirePermission } from '../lib/auth'
import type { StoreAccess } from '../lib/context'
import { assertProductsInScope, loadScopedOrder, orderScope } from '../lib/scope'
import type { AppEnv } from '../lib/context'
import { orderNumber, randomToken } from '../lib/crypto'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { normalizePhone, reserveLine, setPaymentStatus, transitionFulfillment } from '../services/orders'
import { notify } from '../services/notifications'
import { displayPrice, roundMoney, shippingFee } from '../services/pricing'

const idParam = z.object({ id: orderIdSchema })

const assignee = alias(users, 'assignee')

/** Rôles « terrain » : la première action sur une commande libre la leur attribue. */
const AUTO_CLAIM_ROLES = new Set(['closer', 'order_manager'])

async function userName(id: number) {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id)).limit(1)
  return u?.name ?? 'un membre'
}

/** Produits d'une commande (pour le filtre de périmètre des notifications). */
async function orderProductIds(orderIds: string[]) {
  if (!orderIds.length) return []
  const rows = await db.selectDistinct({ productId: orderItems.productId }).from(orderItems).where(inArray(orderItems.orderId, orderIds))
  return rows.map((r) => r.productId).filter((x): x is string => !!x)
}

const STATUS_LABELS: Record<string, string> = { confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', returned: 'Retournée', cancelled: 'Annulée' }
const NOTIFIED_STATUSES = new Set(Object.keys(STATUS_LABELS))

/** Prévient l'équipe d'un changement de statut fait par un membre (sauf lui-même). */
async function notifyStatus(storeId: string, actor: { id: number; name: string }, orderList: Pick<Order, 'id' | 'orderNumber' | 'customerName'>[], status: string) {
  if (!NOTIFIED_STATUSES.has(status) || !orderList.length) return
  const label = STATUS_LABELS[status] ?? status
  const one = orderList.length === 1 ? orderList[0]! : null
  await notify(storeId, 'order.status', {
    title: one ? `${label} : ${one.orderNumber}` : `${orderList.length} commandes : ${label}`,
    body: one ? `${actor.name} · ${one.customerName ?? 'client'}` : `${actor.name} a passé ${orderList.length} commandes en « ${label} »`,
    path: one ? `/stores/${storeId}/orders/${one.id}` : `/stores/${storeId}/orders`,
    productIds: await orderProductIds(orderList.map((o) => o.id)),
    excludeUserId: actor.id,
    tag: one ? `order-${one.id}` : undefined,
  })
}

/** Une commande prise par un autre membre n'est modifiable que par ceux qui peuvent attribuer. */
async function assertCanAct(access: StoreAccess, order: Pick<Order, 'assignedTo'>) {
  if (order.assignedTo && order.assignedTo !== access.userId && !can(access, 'orders.assign')) {
    throw conflict(`Cette commande est déjà prise par ${await userName(order.assignedTo)}`, 'order_taken')
  }
}

/** Prise en charge automatique : celui qui agit le premier sur une commande libre la prend. */
async function autoClaim(access: StoreAccess, orderId: string) {
  if (!AUTO_CLAIM_ROLES.has(access.role)) return
  const [row] = await db
    .update(orders)
    .set({ assignedTo: access.userId, assignedAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.assignedTo)))
    .returning({ id: orders.id })
  if (row) await db.insert(orderEvents).values({ orderId, type: 'assigned', message: 'Prise en charge', data: { assignedTo: access.userId }, userId: access.userId })
}

/** Paiement refusé : statut « failed », ou en attente dont la dernière tentative a échoué (Payment Orchestrator ou prestataire). */
const FAILED_SQL = dsql`(${orders.paymentStatus} = 'failed' or (${orders.paymentStatus} = 'pending' and (coalesce(${orders.poStatus}, '') in ('failed', 'mismatch') or (exists (select 1 from payment_transactions pt where pt.order_id = ${orders.id} and pt.status = 'failed') and not exists (select 1 from payment_transactions pt2 where pt2.order_id = ${orders.id} and pt2.status in ('processing', 'redirect', 'otp_required', 'paid'))))))`

function paymentStateFilter(state: z.infer<typeof orderListQuerySchema>['paymentState']): SQL | undefined {
  if (state === 'paid') return eq(orders.paymentStatus, 'paid')
  if (state === 'refunded') return eq(orders.paymentStatus, 'refunded')
  if (state === 'failed') return FAILED_SQL
  if (state === 'pending') return dsql`(${orders.paymentStatus} = 'pending' and not ${FAILED_SQL})`
  return undefined
}

function listFilters(storeId: string, q: z.infer<typeof orderListQuerySchema>, access: StoreAccess): SQL {
  const conds: SQL[] = [eq(orders.storeId, storeId)]
  const scope = orderScope(access)
  if (scope) conds.push(scope)
  if (q.assigned === 'me') conds.push(eq(orders.assignedTo, access.userId))
  else if (q.assigned === 'none') conds.push(isNull(orders.assignedTo))
  else if (typeof q.assigned === 'number') conds.push(eq(orders.assignedTo, q.assigned))
  if (q.archived === 'only') conds.push(isNotNull(orders.archivedAt))
  else if (q.archived !== 'all') conds.push(isNull(orders.archivedAt))
  if (q.type) conds.push(eq(orders.kind, q.type))
  if (q.paymentStatus) conds.push(eq(orders.paymentStatus, q.paymentStatus))
  const ps = paymentStateFilter(q.paymentState)
  if (ps) conds.push(ps)
  if (q.fulfillmentStatus) conds.push(eq(orders.fulfillmentStatus, q.fulfillmentStatus))
  if (q.from) conds.push(gte(orders.createdAt, q.from))
  if (q.to) {
    // Une date seule (minuit pile) inclut toute la journée.
    const dayOnly = q.to.getUTCHours() === 0 && q.to.getUTCMinutes() === 0 && q.to.getUTCSeconds() === 0 && q.to.getUTCMilliseconds() === 0
    conds.push(dayOnly ? lt(orders.createdAt, new Date(q.to.getTime() + 86400_000)) : lte(orders.createdAt, q.to))
  }
  if (q.q) {
    const like = `%${q.q.replace(/[%_]/g, '\\$&')}%`
    conds.push(or(ilike(orders.orderNumber, like), ilike(orders.customerName, like), ilike(orders.customerPhone, like), ilike(orders.customerEmail, like), ilike(orders.city, like))!)
  }
  return and(...conds)!
}

export const orderRoutes = new Hono<AppEnv>()
  .get('/', requirePermission('orders.view'), v('query', orderListQuerySchema), async (c) => {
    const store = c.get('store')
    const access = c.get('access')
    const q = c.req.valid('query')
    const where = listFilters(store.id, q, access)
    const [rows, [{ total } = { total: 0 }], counts] = await Promise.all([
      db
        .select({
          order: orders,
          items: dsql<{ name: string; variantName: string | null; quantity: number }[]>`(
            select coalesce(json_agg(json_build_object('name', ${orderItems.name}, 'variantName', ${orderItems.variantName}, 'quantity', ${orderItems.quantity})), '[]')
            from ${orderItems} where "order_items"."order_id" = "orders"."id")`,
          customerFlag: dsql<boolean>`coalesce(${customers.isBlocked}, false)`,
          customerReturns: dsql<number>`coalesce(${customers.returnedCount}, 0)`,
          assigneeName: assignee.name,
          downloads: dsql<number>`(select count(*)::int from downloads d where d.order_id = "orders"."id")`,
          paymentFailed: FAILED_SQL.mapWith(Boolean),
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .leftJoin(assignee, eq(assignee.id, orders.assignedTo))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(orders).where(where),
      // Compteurs par statut (pour les onglets), sans le filtre de statut lui-même.
      db
        .select({ status: orders.fulfillmentStatus, n: count() })
        .from(orders)
        .where(listFilters(store.id, { ...q, fulfillmentStatus: undefined }, access))
        .groupBy(orders.fulfillmentStatus),
    ])
    // Compteurs par état de paiement (onglets de la vue digitale), sans le filtre d'état lui-même.
    const [pc] = await db
      .select({
        paid: dsql<number>`count(*) filter (where ${orders.paymentStatus} = 'paid')::int`,
        refunded: dsql<number>`count(*) filter (where ${orders.paymentStatus} = 'refunded')::int`,
        failed: dsql<number>`count(*) filter (where ${FAILED_SQL})::int`,
        pending: dsql<number>`count(*) filter (where ${orders.paymentStatus} = 'pending' and not ${FAILED_SQL})::int`,
      })
      .from(orders)
      .where(listFilters(store.id, { ...q, paymentState: undefined, paymentStatus: undefined }, access))
    return c.json({
      data: rows.map(({ order, ...rest }) => {
        const { accessToken: _t, trackingContext: _tc, ...safe } = order
        return { ...safe, ...rest }
      }),
      total,
      page: q.page,
      pageSize: q.pageSize,
      statusCounts: Object.fromEntries(counts.map((r) => [r.status, r.n])),
      paymentCounts: pc ?? { paid: 0, refunded: 0, failed: 0, pending: 0 },
    })
  })
  .get('/export.csv', requirePermission('orders.view', 'orders.export'), v('query', orderListQuerySchema), async (c) => {
    const store = c.get('store')
    const rows = await db
      .select({ order: orders, items: dsql<string>`(select string_agg(${orderItems.quantity} || ' x ' || ${orderItems.name} || coalesce(' (' || ${orderItems.variantName} || ')', ''), ' + ') from ${orderItems} where "order_items"."order_id" = "orders"."id")` })
      .from(orders)
      .where(listFilters(store.id, c.req.valid('query'), c.get('access')))
      .orderBy(desc(orders.createdAt))
      .limit(10_000)
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      // Neutralise l'injection de formules dans Excel/Sheets.
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
      return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
    }
    const header = ['Numéro', 'Date', 'Client', 'Téléphone', 'Ville', 'Adresse', 'Articles', 'Total', 'Devise', 'Paiement', 'Statut paiement', 'Statut livraison', 'Livreur', 'Suivi', 'Champs personnalisés']
    const customText = (meta: unknown) => {
      const list = (meta as { customFields?: { label: string; value: string }[] } | null)?.customFields
      return Array.isArray(list) ? list.map((f) => `${f.label}: ${f.value}`).join(' | ') : ''
    }
    const lines = rows.map(({ order: o, items }) =>
      [o.orderNumber, o.createdAt.toISOString(), o.customerName, o.customerPhone, o.city, o.address, items, o.total, o.currency, o.paymentMethod, o.paymentStatus, o.fulfillmentStatus, o.courier, o.trackingNumber, customText(o.metadata)].map(esc).join(';'),
    )
    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="commandes-${store.slug}.csv"`)
    return c.body(`﻿${[header.join(';'), ...lines].join('\n')}`)
  })
  .get('/:id', requirePermission('orders.view'), v('param', idParam), async (c) => {
    const store = c.get('store')
    const { id } = c.req.valid('param')
    const order = await loadScopedOrder(c.get('access'), store.id, id)
    const [items, events, transactions, customer, zone] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db
        .select({ event: orderEvents, userName: users.name })
        .from(orderEvents)
        .leftJoin(users, eq(users.id, orderEvents.userId))
        .where(eq(orderEvents.orderId, id))
        .orderBy(asc(orderEvents.createdAt)),
      db
        .select({
          id: paymentTransactions.id,
          provider: paymentTransactions.provider,
          providerRef: paymentTransactions.providerRef,
          status: paymentTransactions.status,
          network: paymentTransactions.network,
          amount: paymentTransactions.amount,
          errorMessage: paymentTransactions.errorMessage,
          createdAt: paymentTransactions.createdAt,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.orderId, id))
        .orderBy(desc(paymentTransactions.createdAt)),
      order.customerId ? db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1).then((r) => r[0] ?? null) : null,
      order.deliveryZoneId ? db.select().from(deliveryZones).where(eq(deliveryZones.id, order.deliveryZoneId)).limit(1).then((r) => r[0] ?? null) : null,
    ])
    const assigneeName = order.assignedTo ? await userName(order.assignedTo) : null
    const { accessToken: _t, trackingContext: _tc, ...safe } = order
    // Coûts (prix d'achat, livreur, retour) : seulement pour ceux qui voient le chiffre d'affaires.
    const seesCosts = can(c.get('access'), 'stats.revenue')
    return c.json({
      ...safe,
      ...(seesCosts ? {} : { deliveryCost: null, returnCost: null }),
      items: seesCosts ? items : items.map((i) => ({ ...i, unitCost: null })),
      events: events.map(({ event, userName }) => ({ ...event, userName })),
      transactions,
      customer,
      zone: zone && !seesCosts ? { ...zone, courierCost: null, returnCost: null } : zone,
      assigneeName,
      allowedTransitions: FULFILLMENT_TRANSITIONS[order.fulfillmentStatus],
      // Produits digitaux : lien client (accès au produit, ou paiement à finaliser) et historique des téléchargements.
      customerUrl: orderUrl(c.get('store').slug, order.accessToken),
      downloads: await db.select({ at: downloads.createdAt, productId: downloads.productId }).from(downloads).where(eq(downloads.orderId, order.id)).orderBy(desc(downloads.createdAt)).limit(50),
    })
  })
  .post('/:id/status', requirePermission('orders.update'), v('param', idParam), v('json', orderStatusUpdateSchema), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const access = c.get('access')
    const order = await loadScopedOrder(access, c.get('store').id, id)
    await assertCanAct(access, order)
    await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
    await autoClaim(access, id)
    await notifyStatus(c.get('store').id, c.get('user'), [order], body.fulfillmentStatus)
    return c.json({ ok: true })
  })
  .post('/bulk-status', requirePermission('orders.update'), v('json', orderStatusUpdateSchema.extend({ ids: z.array(orderIdSchema).min(1).max(200) })), async (c) => {
    const { ids, ...body } = c.req.valid('json')
    const access = c.get('access')
    const results: { id: string; ok: boolean; error?: string }[] = []
    const done: Order[] = []
    for (const id of ids) {
      try {
        const order = await loadScopedOrder(access, c.get('store').id, id)
        await assertCanAct(access, order)
        await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
        await autoClaim(access, id)
        done.push(order)
        results.push({ id, ok: true })
      } catch (e) {
        results.push({ id, ok: false, error: e instanceof Error ? e.message : 'Erreur' })
      }
    }
    await notifyStatus(c.get('store').id, c.get('user'), done, body.fulfillmentStatus)
    return c.json({ results })
  })
  /** Archiver ou désarchiver des commandes (masquées des listes, toujours comptées dans les statistiques). */
  .post('/archive', requirePermission('orders.update'), v('json', z.object({ ids: z.array(orderIdSchema).min(1).max(500), archived: z.boolean() })), async (c) => {
    const { ids, archived } = c.req.valid('json')
    const store = c.get('store')
    const scope = orderScope(c.get('access'))
    const rows = await db
      .update(orders)
      .set({ archivedAt: archived ? new Date() : null })
      .where(and(eq(orders.storeId, store.id), inArray(orders.id, ids), ...(scope ? [scope] : [])))
      .returning({ id: orders.id })
    if (rows.length) await db.insert(orderEvents).values(rows.map((r) => ({ orderId: r.id, type: 'edited', message: archived ? 'Commande archivée' : 'Commande désarchivée', userId: c.get('user').id })))
    return c.json({ updated: rows.length })
  })
  .post('/:id/payment', requirePermission('orders.payment'), v('param', idParam), v('json', orderPaymentUpdateSchema), async (c) => {
    const { id } = c.req.valid('param')
    await loadScopedOrder(c.get('access'), c.get('store').id, id)
    const { paymentStatus, note } = c.req.valid('json')
    await setPaymentStatus(c.get('store'), id, paymentStatus, c.get('user').id, note)
    return c.json({ ok: true })
  })
  .post('/:id/notes', requirePermission('orders.update'), v('param', idParam), v('json', orderNoteSchema), async (c) => {
    const { id } = c.req.valid('param')
    await loadScopedOrder(c.get('access'), c.get('store').id, id)
    const [event] = await db.insert(orderEvents).values({ orderId: id, type: 'note', message: c.req.valid('json').note, userId: c.get('user').id }).returning()
    return c.json(event, 201)
  })
  .patch(
    '/:id',
    requirePermission('orders.update'),
    v('param', idParam),
    v('json', z.object({ customerName: z.string().max(120).optional(), customerPhone: z.string().max(30).optional(), city: z.string().max(120).nullable().optional(), address: z.string().max(500).nullable().optional(), courier: z.string().max(80).nullable().optional(), trackingNumber: z.string().max(80).nullable().optional(), deliveryCost: z.coerce.number().min(0).max(1_000_000_000).nullable().optional(), returnCost: z.coerce.number().min(0).max(1_000_000_000).nullable().optional() })),
    async (c) => {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      // Les coûts réels pèsent sur le bénéfice : réservés à ceux qui voient le chiffre d'affaires.
      if ((body.deliveryCost !== undefined || body.returnCost !== undefined) && !can(c.get('access'), 'stats.revenue')) throw forbidden('Tu ne peux pas modifier les coûts de livraison')
      await assertCanAct(c.get('access'), await loadScopedOrder(c.get('access'), c.get('store').id, id))
      const [row] = await db
        .update(orders)
        .set({ ...body, ...(body.customerPhone ? { customerPhone: normalizePhone(body.customerPhone) } : {}) })
        .where(and(eq(orders.id, id), eq(orders.storeId, c.get('store').id)))
        .returning({ id: orders.id })
      if (!row) throw notFound('Commande')
      await db.insert(orderEvents).values({ orderId: id, type: 'edited', message: 'Informations modifiées', data: body, userId: c.get('user').id })
      return c.json({ ok: true })
    },
  )
  /** « Je prends » : seulement si la commande est libre (ou déjà à moi). */
  .post('/:id/claim', requirePermission('orders.update'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const access = c.get('access')
    const order = await loadScopedOrder(access, c.get('store').id, id)
    if (order.assignedTo === access.userId) return c.json({ ok: true })
    const [row] = await db
      .update(orders)
      .set({ assignedTo: access.userId, assignedAt: new Date() })
      .where(and(eq(orders.id, id), isNull(orders.assignedTo)))
      .returning({ id: orders.id })
    if (!row) throw conflict(`Cette commande est déjà prise par ${await userName(order.assignedTo!)}`, 'order_taken')
    await db.insert(orderEvents).values({ orderId: id, type: 'assigned', message: 'Prise en charge', data: { assignedTo: access.userId }, userId: access.userId })
    return c.json({ ok: true })
  })
  /** « Libérer » : rend la commande disponible pour les autres. */
  .post('/:id/release', requirePermission('orders.update'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const access = c.get('access')
    const order = await loadScopedOrder(access, c.get('store').id, id)
    if (!order.assignedTo) return c.json({ ok: true })
    if (order.assignedTo !== access.userId && !can(access, 'orders.assign')) throw forbidden('Seul le membre qui a pris la commande peut la libérer')
    await db.update(orders).set({ assignedTo: null, assignedAt: null }).where(eq(orders.id, id))
    await db.insert(orderEvents).values({ orderId: id, type: 'assigned', message: 'Commande libérée', data: { assignedTo: null }, userId: access.userId })
    return c.json({ ok: true })
  })
  /** Attribuer à un membre précis (qui doit pouvoir traiter cette commande). */
  .post('/:id/assign', requirePermission('orders.assign'), v('param', idParam), v('json', orderAssignSchema), async (c) => {
    const { id } = c.req.valid('param')
    const { userId } = c.req.valid('json')
    const store = c.get('store')
    const access = c.get('access')
    const order = await loadScopedOrder(access, store.id, id)
    let message = 'Commande libérée'
    if (userId) {
      const [member] = await db.select().from(storeMembers).where(and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, userId))).limit(1)
      const target = member ? await loadAccess(store.id, userId, member) : null
      if (!target || !can(target, 'orders.update')) throw badRequest('Ce membre ne peut pas traiter les commandes')
      // Le membre doit avoir accès aux produits de la commande.
      await loadScopedOrder(target, store.id, id).catch(() => {
        throw badRequest('Ce membre n’a pas accès aux produits de cette commande')
      })
      message = userId === access.userId ? 'Prise en charge' : `Attribuée à ${await userName(userId)}`
    }
    await db.update(orders).set({ assignedTo: userId, assignedAt: userId ? new Date() : null }).where(eq(orders.id, id))
    await db.insert(orderEvents).values({ orderId: id, type: 'assigned', message, data: { assignedTo: userId }, userId: access.userId })
    if (userId && userId !== access.userId) {
      await notify(store.id, 'order.assigned', {
        title: `Commande ${order.orderNumber} pour vous`,
        body: `${c.get('user').name} vous a confié la commande de ${order.customerName ?? 'un client'}${order.city ? ` (${order.city})` : ''}.`,
        path: `/stores/${store.id}/orders/${id}`,
        productIds: await orderProductIds([id]),
        targetUserId: userId,
        tag: `order-${id}`,
        sound: 'soft',
      })
    }
    return c.json({ ok: true })
  })
  /** Commande saisie à la main (WhatsApp, téléphone, boutique physique). */
  /** Produit digital : renvoyer l'accès au client (avec correction de l'email si besoin). */
  .post('/:id/resend-access', requirePermission('orders.update'), v('param', idParam), v('json', z.object({ email: z.string().trim().toLowerCase().email().optional() })), async (c) => {
    const { id } = c.req.valid('param')
    const order = await loadScopedOrder(c.get('access'), c.get('store').id, id)
    if (order.paymentStatus !== 'paid') throw badRequest('La commande n’est pas encore payée', 'not_paid')
    if (order.kind === 'physical') throw badRequest('Réservé aux produits digitaux', 'not_digital')
    const email = c.req.valid('json').email ?? order.customerEmail
    if (!email) throw badRequest('Indique l’email du client', 'email_required')
    if (email !== order.customerEmail) await db.update(orders).set({ customerEmail: email }).where(eq(orders.id, order.id))
    const o = (await loadOrder(order.id))!
    const mail = customerDigitalEmail({ ...(await emailOrder(o)), accessUrl: orderUrl(o.store.slug, o.order.accessToken) })
    await sendEmail(email, mail.subject, mail.html, customerMailOpts(o))
    await db.insert(orderEvents).values({ orderId: order.id, type: 'access_resent', message: `Accès renvoyé à ${email}`, userId: c.get('user').id })
    return c.json({ ok: true, email })
  })
  /** Paiement en attente ou refusé : envoyer au client le lien pour finaliser (email), et le renvoyer pour WhatsApp. */
  .post('/:id/send-payment-link', requirePermission('orders.update'), v('param', idParam), v('json', z.object({ email: z.boolean().default(true) })), async (c) => {
    const { id } = c.req.valid('param')
    const order = await loadScopedOrder(c.get('access'), c.get('store').id, id)
    if (order.paymentStatus === 'paid') throw badRequest('Cette commande est déjà payée', 'already_paid')
    if (order.paymentMethod === 'cod') throw badRequest('Commande payée à la livraison', 'cod_order')
    const o = (await loadOrder(order.id))!
    const payUrl = orderUrl(o.store.slug, o.order.accessToken)
    let emailed = false
    if (c.req.valid('json').email && order.customerEmail) {
      const mail = customerPaymentReminderEmail({ ...(await emailOrder(o)), payUrl })
      await sendEmail(order.customerEmail, mail.subject, mail.html, customerMailOpts(o))
      emailed = true
    }
    await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_link_sent', message: emailed ? `Lien de paiement envoyé à ${order.customerEmail}` : 'Lien de paiement copié', userId: c.get('user').id })
    return c.json({ ok: true, url: payUrl, emailed })
  })
  .post('/', requirePermission('orders.create'), v('json', manualOrderCreateSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    const productIds = input.items.map((i) => i.productId)
    assertProductsInScope(c.get('access'), productIds)
    const prods = await db.select().from(products).where(and(eq(products.storeId, store.id), inArray(products.id, productIds)))
    const variantIds = input.items.map((i) => i.variantId).filter((x): x is number => !!x)
    const vars = variantIds.length ? await db.select().from(productVariants).where(inArray(productVariants.id, variantIds)) : []
    const lines = input.items.map((i) => {
      const p = prods.find((x) => x.id === i.productId)
      if (!p) throw badRequest(`Produit ${i.productId} introuvable`)
      const variant = i.variantId ? vars.find((x) => x.id === i.variantId && x.productId === p.id) : undefined
      const unit = i.unitPrice ?? displayPrice(p, store.currency, variant ?? null).effective
      return { p, variant, quantity: i.quantity, unit, total: roundMoney(unit * i.quantity, store.currency) }
    })
    const subtotal = lines.reduce((s, l) => s + l.total, 0)
    const zone = input.deliveryZoneId ? (await db.select().from(deliveryZones).where(and(eq(deliveryZones.id, input.deliveryZoneId), eq(deliveryZones.storeId, store.id))).limit(1))[0] : undefined
    const fee = input.shippingFee ?? shippingFee(zone ?? null, subtotal)
    const kinds = new Set(lines.map((l) => l.p.type))
    const phone = normalizePhone(input.customerPhone)

    const order = await db.transaction(async (tx) => {
      // Stock : même règle que les commandes du storefront (verrou + contrôle + réservation ; pack : chaque produit inclus).
      const reserved: Awaited<ReturnType<typeof reserveLine>>[] = []
      for (const l of lines) {
        const [locked] = await tx.select().from(products).where(eq(products.id, l.p.id)).for('update')
        const [lv] = l.variant ? await tx.select().from(productVariants).where(eq(productVariants.id, l.variant.id)).for('update') : []
        reserved.push(await reserveLine(tx, store.id, locked!, lv ?? null, l.quantity))
      }
      const [customer] = await tx
        .insert(customers)
        .values({ storeId: store.id, phone, name: input.customerName, email: input.customerEmail ?? null, city: input.city ?? null, address: input.address ?? null, ordersCount: 1 })
        .onConflictDoUpdate({
          target: [customers.storeId, customers.phone],
          set: {
            name: input.customerName,
            email: dsql`coalesce(excluded.email, ${customers.email})`,
            city: dsql`coalesce(excluded.city, ${customers.city})`,
            address: dsql`coalesce(excluded.address, ${customers.address})`,
            ordersCount: dsql`${customers.ordersCount} + 1`,
            updatedAt: new Date(),
          },
        })
        .returning()
      const [o] = await tx
        .insert(orders)
        .values({
          storeId: store.id,
          orderNumber: orderNumber(),
          accessToken: randomToken(24),
          customerId: customer?.id,
          customerName: input.customerName,
          customerPhone: phone,
          customerEmail: input.customerEmail ?? null,
          city: input.city ?? null,
          address: input.address ?? null,
          deliveryZoneId: zone?.id ?? null,
          deliveryCost: zone?.courierCost ?? null,
          returnCost: zone?.returnCost ?? null,
          customerNote: input.note ?? null,
          kind: kinds.size > 1 ? 'mixed' : (lines[0]?.p.type ?? 'physical'),
          subtotal,
          shippingFee: fee,
          total: roundMoney(subtotal + fee, store.currency),
          currency: store.currency,
          paymentMethod: input.paymentMethod,
          source: 'manual',
          ...(AUTO_CLAIM_ROLES.has(c.get('access').role) ? { assignedTo: c.get('access').userId, assignedAt: new Date() } : {}),
          eventId: randomToken(16),
        })
        .returning()
      if (!o) throw new Error('Création commande échouée')
      await tx.insert(orderItems).values(
        lines.map((l, k) => ({ orderId: o.id, productId: l.p.id, variantId: l.variant?.id ?? null, productType: l.p.type, name: l.p.name, variantName: l.variant?.name ?? null, quantity: l.quantity, unitPrice: l.unit, unitCost: reserved[k]!.unitCost, bundle: reserved[k]!.bundle, total: l.total })),
      )
      await tx.insert(orderEvents).values({ orderId: o.id, type: 'created', message: 'Commande saisie manuellement', userId: c.get('user').id })
      return o
    })
    return c.json({ id: order.id, orderNumber: order.orderNumber }, 201)
  })
