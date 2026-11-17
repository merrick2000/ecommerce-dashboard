import {
  FULFILLMENT_TRANSITIONS,
  manualOrderCreateSchema,
  orderListQuerySchema,
  orderNoteSchema,
  orderPaymentUpdateSchema,
  orderStatusUpdateSchema,
  orderIdSchema,
} from '@zuri/shared'
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, sql as dsql, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { customers, deliveryZones, orderEvents, orderItems, orders, paymentTransactions, productVariants, products, users } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { orderNumber, randomToken } from '../lib/crypto'
import { badRequest, conflict, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { normalizePhone, setPaymentStatus, transitionFulfillment } from '../services/orders'
import { displayPrice, roundMoney, shippingFee } from '../services/pricing'

const idParam = z.object({ id: orderIdSchema })

function listFilters(storeId: string, q: z.infer<typeof orderListQuerySchema>): SQL {
  const conds: SQL[] = [eq(orders.storeId, storeId)]
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
  .get('/', v('query', orderListQuerySchema), async (c) => {
    const store = c.get('store')
    const q = c.req.valid('query')
    const where = listFilters(store.id, q)
    const [rows, [{ total } = { total: 0 }], counts] = await Promise.all([
      db
        .select({
          order: orders,
          items: dsql<{ name: string; variantName: string | null; quantity: number }[]>`(
            select coalesce(json_agg(json_build_object('name', ${orderItems.name}, 'variantName', ${orderItems.variantName}, 'quantity', ${orderItems.quantity})), '[]')
            from ${orderItems} where "order_items"."order_id" = "orders"."id")`,
          customerFlag: dsql<boolean>`coalesce(${customers.isBlocked}, false)`,
          customerReturns: dsql<number>`coalesce(${customers.returnedCount}, 0)`,
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      db.select({ total: count() }).from(orders).where(where),
      // Compteurs par statut (pour les onglets), sans le filtre de statut lui-même.
      db
        .select({ status: orders.fulfillmentStatus, n: count() })
        .from(orders)
        .where(listFilters(store.id, { ...q, fulfillmentStatus: undefined }))
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
  .get('/export.csv', requireRole('staff'), v('query', orderListQuerySchema), async (c) => {
    const store = c.get('store')
    const rows = await db
      .select({ order: orders, items: dsql<string>`(select string_agg(${orderItems.quantity} || ' x ' || ${orderItems.name} || coalesce(' (' || ${orderItems.variantName} || ')', ''), ' + ') from ${orderItems} where "order_items"."order_id" = "orders"."id")` })
      .from(orders)
      .where(listFilters(store.id, c.req.valid('query')))
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
  .get('/:id', v('param', idParam), async (c) => {
    const store = c.get('store')
    const { id } = c.req.valid('param')
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.storeId, store.id))).limit(1)
    if (!order) throw notFound('Commande')
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
    const { accessToken: _t, trackingContext: _tc, ...safe } = order
    return c.json({
      ...safe,
      items,
      events: events.map(({ event, userName }) => ({ ...event, userName })),
      transactions,
      customer,
      zone,
      allowedTransitions: FULFILLMENT_TRANSITIONS[order.fulfillmentStatus],
    })
  })
  .post('/:id/status', v('param', idParam), v('json', orderStatusUpdateSchema), async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
    return c.json({ ok: true })
  })
  .post('/bulk-status', requireRole('staff'), v('json', orderStatusUpdateSchema.extend({ ids: z.array(orderIdSchema).min(1).max(200) })), async (c) => {
    const { ids, ...body } = c.req.valid('json')
    const results: { id: string; ok: boolean; error?: string }[] = []
    for (const id of ids) {
      try {
        await transitionFulfillment(c.get('store'), id, body.fulfillmentStatus, { userId: c.get('user').id, ...body })
        results.push({ id, ok: true })
      } catch (e) {
        results.push({ id, ok: false, error: e instanceof Error ? e.message : 'Erreur' })
      }
    }
    return c.json({ results })
  })
  .post('/:id/payment', requireRole('admin'), v('param', idParam), v('json', orderPaymentUpdateSchema), async (c) => {
    const { id } = c.req.valid('param')
    const { paymentStatus, note } = c.req.valid('json')
    await setPaymentStatus(c.get('store'), id, paymentStatus, c.get('user').id, note)
    return c.json({ ok: true })
  })
  .post('/:id/notes', v('param', idParam), v('json', orderNoteSchema), async (c) => {
    const { id } = c.req.valid('param')
    const [order] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, id), eq(orders.storeId, c.get('store').id))).limit(1)
    if (!order) throw notFound('Commande')
    const [event] = await db.insert(orderEvents).values({ orderId: id, type: 'note', message: c.req.valid('json').note, userId: c.get('user').id }).returning()
    return c.json(event, 201)
  })
  .patch(
    '/:id',
    requireRole('staff'),
    v('param', idParam),
    v('json', z.object({ customerName: z.string().max(120).optional(), customerPhone: z.string().max(30).optional(), city: z.string().max(120).nullable().optional(), address: z.string().max(500).nullable().optional(), courier: z.string().max(80).nullable().optional(), trackingNumber: z.string().max(80).nullable().optional() })),
    async (c) => {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
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
  /** Commande saisie à la main (WhatsApp, téléphone, boutique physique). */
  .post('/', requireRole('staff'), v('json', manualOrderCreateSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    const productIds = input.items.map((i) => i.productId)
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
