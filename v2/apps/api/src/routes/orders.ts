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
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, or, sql as dsql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { customers, deliveryZones, orderEvents, orderItems, orders, paymentTransactions, productVariants, products, storeMembers, users, type Order } from '../db/schema'
import { can, loadAccess, requirePermission } from '../lib/auth'
import type { StoreAccess } from '../lib/context'
import { assertProductsInScope, loadScopedOrder, orderScope } from '../lib/scope'
import type { AppEnv } from '../lib/context'
import { orderNumber, randomToken } from '../lib/crypto'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { normalizePhone, setPaymentStatus, transitionFulfillment } from '../services/orders'
import { displayPrice, roundMoney, shippingFee } from '../services/pricing'

const idParam = z.object({ id: orderIdSchema })

const assignee = alias(users, 'assignee')

/** Rôles « terrain » : la première action sur une commande libre la leur attribue. */
const AUTO_CLAIM_ROLES = new Set(['closer', 'order_manager'])

async function userName(id: number) {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id)).limit(1)
  return u?.name ?? 'un membre'
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

function listFilters(storeId: string, q: z.infer<typeof orderListQuerySchema>, access: StoreAccess): SQL {
  const conds: SQL[] = [eq(orders.storeId, storeId)]
  const scope = orderScope(access)
  if (scope) conds.push(scope)
  if (q.assigned === 'me') conds.push(eq(orders.assignedTo, access.userId))
  else if (q.assigned === 'none') conds.push(isNull(orders.assignedTo))
  else if (typeof q.assigned === 'number') conds.push(eq(orders.assignedTo, q.assigned))
  if (q.type) conds.push(eq(orders.kind, q.type))
  if (q.paymentStatus) conds.push(eq(orders.paymentStatus, q.paymentStatus))
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
    return c.json({
      data: rows.map(({ order, ...rest }) => {
        const { accessToken: _t, trackingContext: _tc, ...safe } = order
        return { ...safe, ...rest }
      }),
      total,
      page: q.page,
      pageSize: q.pageSize,
      statusCounts: Object.fromEntries(counts.map((r) => [r.status, r.n])),
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
    const header = ['Numéro', 'Date', 'Client', 'Téléphone', 'Ville', 'Adresse', 'Articles', 'Total', 'Devise', 'Paiement', 'Statut paiement', 'Statut livraison', 'Livreur', 'Suivi']
    const lines = rows.map(({ order: o, items }) =>
      [o.orderNumber, o.createdAt.toISOString(), o.customerName, o.customerPhone, o.city, o.address, items, o.total, o.currency, o.paymentMethod, o.paymentStatus, o.fulfillmentStatus, o.courier, o.trackingNumber].map(esc).join(';'),
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
    return c.json({
      ...safe,
      items,
      events: events.map(({ event, userName }) => ({ ...event, userName })),
      transactions,
      customer,
      zone,
      assigneeName,
      allowedTransitions: FULFILLMENT_TRANSITIONS[order.fulfillmentStatus],
    })
  })
  .post('/:id/status', requirePermission('orders.update'), v('param', idParam), v('json', orderStatusUpdateSchema), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const access = c.get('access')
    await assertCanAct(access, await loadScopedOrder(access, c.get('store').id, id))
    await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
    await autoClaim(access, id)
    return c.json({ ok: true })
  })
  .post('/bulk-status', requirePermission('orders.update'), v('json', orderStatusUpdateSchema.extend({ ids: z.array(orderIdSchema).min(1).max(200) })), async (c) => {
    const { ids, ...body } = c.req.valid('json')
    const access = c.get('access')
    const results: { id: string; ok: boolean; error?: string }[] = []
    for (const id of ids) {
      try {
        await assertCanAct(access, await loadScopedOrder(access, c.get('store').id, id))
        await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
        await autoClaim(access, id)
        results.push({ id, ok: true })
      } catch (e) {
        results.push({ id, ok: false, error: e instanceof Error ? e.message : 'Erreur' })
      }
    }
    return c.json({ results })
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
    v('json', z.object({ customerName: z.string().max(120).optional(), customerPhone: z.string().max(30).optional(), city: z.string().max(120).nullable().optional(), address: z.string().max(500).nullable().optional(), courier: z.string().max(80).nullable().optional(), trackingNumber: z.string().max(80).nullable().optional() })),
    async (c) => {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
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
    await loadScopedOrder(access, store.id, id)
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
    return c.json({ ok: true })
  })
  /** Commande saisie à la main (WhatsApp, téléphone, boutique physique). */
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
      // Stock : même règle que les commandes du storefront (verrou + contrôle + réservation).
      for (const l of lines) {
        if (l.p.type !== 'physical' || !l.p.trackInventory) continue
        if (l.variant) {
          const [vr] = await tx.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, l.variant.id)).for('update')
          if (vr?.stock != null) {
            if (vr.stock < l.quantity) throw conflict(`Stock insuffisant : ${l.p.name} (${l.variant.name})`, 'out_of_stock')
            await tx.update(productVariants).set({ stock: vr.stock - l.quantity }).where(eq(productVariants.id, l.variant.id))
          }
        } else {
          const [pr] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, l.p.id)).for('update')
          if (pr?.stock != null) {
            if (pr.stock < l.quantity) throw conflict(`Stock insuffisant : ${l.p.name}`, 'out_of_stock')
            await tx.update(products).set({ stock: pr.stock - l.quantity }).where(eq(products.id, l.p.id))
          }
        }
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
        lines.map((l) => ({ orderId: o.id, productId: l.p.id, variantId: l.variant?.id ?? null, productType: l.p.type, name: l.p.name, variantName: l.variant?.name ?? null, quantity: l.quantity, unitPrice: l.unit, total: l.total })),
      )
      await tx.insert(orderEvents).values({ orderId: o.id, type: 'created', message: 'Commande saisie manuellement', userId: c.get('user').id })
      return o
    })
    return c.json({ id: order.id, orderNumber: order.orderNumber }, 201)
  })
