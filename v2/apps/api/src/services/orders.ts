import {
  FULFILLMENT_TRANSITIONS,
  NATIVE_PROVIDERS,
  checkCustomFields,
  parseOrderForm,
  resolveFormFields,
  type FulfillmentStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PublicOrderCreate,
} from '@zuri/shared'
import { HttpError } from '../lib/errors'
import { and, eq, inArray, isNull, sql as dsql } from 'drizzle-orm'
import { db, type Tx } from '../db/client'
import {
  checkoutSettings,
  customers,
  deliveryZones,
  leads,
  orderEvents,
  paymentAccounts,
  orderItems,
  orders,
  productVariants,
  products,
  promoCodes,
  stores,
  type Order,
  type Store,
} from '../db/schema'
import { orderNumber, randomToken } from '../lib/crypto'
import { badRequest, conflict, notFound } from '../lib/errors'
import { ValidationError } from '../lib/validate'
import { enqueue } from '../jobs/queue'
import { quote } from './pricing'

/** Normalise un numéro pour en faire une clé client stable (+229 97 00 00 00 → +22997000000). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.startsWith('00') ? `+${digits.slice(2)}` : digits
}

interface RequestContext {
  ip?: string
  userAgent?: string
}

export interface CreatedOrder {
  order: Order
  promoError: string | null
}

/**
 * Création d'une commande depuis le storefront.
 * Tout se fait dans une transaction : verrou sur le produit (stock), client,
 * commande, ligne, utilisation du code promo, historique.
 */
export async function createPublicOrder(input: PublicOrderCreate, ctx: RequestContext): Promise<CreatedOrder> {
  const result = await db.transaction(async (tx) => {
    const [store] = await tx.select().from(stores).where(eq(stores.slug, input.storeSlug)).limit(1)
    if (!store || store.closedAt) throw notFound('Boutique')
    if (store.status === 'paused') throw new HttpError(409, 'Cette boutique est en pause : les commandes reprendront bientôt.', 'store_paused')

    // FOR UPDATE : deux commandes simultanées ne peuvent pas vendre le même dernier article.
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, input.productId), eq(products.storeId, store.id)))
      .for('update')
      .limit(1)
    if (!product || !product.isActive) throw notFound('Produit')

    const variant = input.variantId
      ? (await tx.select().from(productVariants).where(and(eq(productVariants.id, input.variantId), eq(productVariants.productId, product.id))).for('update').limit(1))[0]
      : undefined
    if (input.variantId && (!variant || !variant.isActive)) throw badRequest('Variante indisponible')

    const isPhysical = product.type === 'physical'
    const choice = product.payment.method
    if (choice === 'cod' && !isPhysical) throw badRequest('Paiement à la livraison indisponible pour ce produit')
    if (choice === 'native') {
      const [account] = await tx
        .select({ id: paymentAccounts.id })
        .from(paymentAccounts)
        .where(and(eq(paymentAccounts.storeId, store.id), eq(paymentAccounts.enabled, true), inArray(paymentAccounts.provider, [...NATIVE_PROVIDERS])))
        .limit(1)
      if (!account) throw badRequest('Le paiement en ligne n’est pas activé pour cette boutique', 'payments_disabled')
    }
    const paymentMethod: PaymentMethod = choice === 'cod' ? 'cod' : choice === 'integration' ? 'external' : 'mobile_money'

    if (!isPhysical && !input.customerEmail) throw badRequest('Email requis pour recevoir le produit', 'email_required')

    // Formulaire effectif (produit, sinon boutique) : le serveur revérifie ce que le storefront a validé.
    const [cfg] = await tx.select({ settings: checkoutSettings.settings }).from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1)
    const formFields = resolveFormFields(parseOrderForm(product.content.orderForm ?? cfg?.settings.form), product.type)
    const required = (key: string) => formFields.some((f) => f.key === key && f.visible && f.required)
    if (required('email') && !input.customerEmail) throw badRequest('Email requis', 'email_required')
    const custom = checkCustomFields(formFields, input.customFields)
    if (!custom.ok) throw new ValidationError(custom.issues.map((i) => ({ path: `customFields.${i.key}`, message: i.message })))

    let zone = null
    if (isPhysical) {
      if (!input.address && !input.city) throw badRequest('Adresse de livraison requise', 'address_required')
      if (input.deliveryZoneId) {
        ;[zone] = await tx
          .select()
          .from(deliveryZones)
          .where(and(eq(deliveryZones.id, input.deliveryZoneId), eq(deliveryZones.storeId, store.id), eq(deliveryZones.isActive, true)))
          .limit(1)
        if (!zone) throw badRequest('Zone de livraison invalide')
        if (paymentMethod === 'cod' && !zone.codAllowed) throw badRequest('Paiement à la livraison indisponible dans cette zone')
      }
    }

    let promo = null
    if (input.promoCode) {
      ;[promo] = await tx
        .select()
        .from(promoCodes)
        .where(and(eq(promoCodes.storeId, store.id), eq(promoCodes.code, input.promoCode)))
        .for('update')
        .limit(1)
    }

    const q = quote({
      product,
      variant: variant ?? null,
      storeCurrency: store.currency,
      quantity: isPhysical ? input.quantity : 1,
      offerId: input.offerId,
      promoCode: promo ?? null,
      productId: product.id,
      zone: zone ?? null,
    })

    // Stock : réservé à la commande, rendu en cas d'annulation/retour.
    if (isPhysical && product.trackInventory) {
      const available = variant ? variant.stock : product.stock
      if (available != null && available < q.quantity) throw conflict('Stock insuffisant', 'out_of_stock')
      if (variant && variant.stock != null) {
        await tx.update(productVariants).set({ stock: dsql`${productVariants.stock} - ${q.quantity}` }).where(eq(productVariants.id, variant.id))
      } else if (product.stock != null) {
        await tx.update(products).set({ stock: dsql`${products.stock} - ${q.quantity}` }).where(eq(products.id, product.id))
      }
    }

    const phone = normalizePhone(input.customerPhone)
    const customer = await upsertCustomer(tx, store.id, {
      phone,
      name: input.customerName,
      email: input.customerEmail ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
    })

    const [order] = await tx
      .insert(orders)
      .values({
        storeId: store.id,
        orderNumber: orderNumber(),
        accessToken: randomToken(24),
        customerId: customer.id,
        customerName: input.customerName,
        customerEmail: input.customerEmail ?? null,
        customerPhone: phone,
        city: input.city ?? null,
        address: input.address ?? null,
        deliveryZoneId: zone?.id ?? null,
        customerNote: input.note ?? null,
        kind: product.type,
        subtotal: q.subtotal,
        discount: q.discount,
        shippingFee: q.shippingFee,
        total: q.total,
        currency: q.currency,
        paymentMethod,
        promoCodeId: q.discount > 0 && promo ? promo.id : null,
        promoCode: q.discount > 0 && promo ? promo.code : null,
        source: choice === 'integration' ? (product.payment.integration?.platform ?? 'external') : 'storefront',
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        referrer: input.referrer,
        sessionId: input.sessionId,
        eventId: input.eventId ?? randomToken(16),
        trackingContext: { ip: ctx.ip, userAgent: ctx.userAgent, fbp: input.fbp, fbc: input.fbc },
        metadata:
          customer.isBlocked || custom.answers.length
            ? { ...(customer.isBlocked ? { flagged: 'blocked_customer' } : {}), ...(custom.answers.length ? { customFields: custom.answers } : {}) }
            : null,
      })
      .returning()
    if (!order) throw new Error('Insertion commande échouée')

    await tx.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      variantId: variant?.id ?? null,
      productType: product.type,
      name: product.name,
      variantName: variant?.name ?? null,
      quantity: q.quantity,
      unitPrice: q.unitPrice,
      total: q.subtotal,
    })

    if (order.promoCodeId) {
      await tx.update(promoCodes).set({ usedCount: dsql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.id, order.promoCodeId))
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      type: 'created',
      message: paymentMethod === 'cod' ? 'Commande reçue (paiement à la livraison)' : 'Commande créée',
      data: { quantity: q.quantity, offerId: q.offerId, total: q.total },
    })

    return { order, promoError: q.promoError, store }
  })

  if (result.order.paymentMethod === 'cod') {
    // Une commande COD est une vente (à confirmer) : on notifie tout de suite.
    await enqueue('order.notify-new', { orderId: result.order.id })
  }
  return { order: result.order, promoError: result.promoError }
}

async function upsertCustomer(tx: Tx, storeId: string, data: { phone: string; name: string; email: string | null; city: string | null; address: string | null }) {
  const [row] = await tx
    .insert(customers)
    .values({ storeId, ...data, ordersCount: 1 })
    .onConflictDoUpdate({
      target: [customers.storeId, customers.phone],
      set: {
        name: data.name,
        email: dsql`coalesce(excluded.email, ${customers.email})`,
        city: dsql`coalesce(excluded.city, ${customers.city})`,
        address: dsql`coalesce(excluded.address, ${customers.address})`,
        ordersCount: dsql`${customers.ordersCount} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning()
  if (!row) throw new Error('Upsert client échoué')
  return row
}

/**
 * Marque une commande payée. Idempotent et sûr en concurrence (webhook + polling
 * simultanés) : verrou de ligne, puis effets de bord déclenchés une seule fois.
 */
export async function markOrderPaid(orderId: string, info: { provider?: string | null; ref?: string | null; userId?: number; note?: string }) {
  const changed = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update').limit(1)
    if (!order) throw notFound('Commande')
    if (order.paymentStatus === 'paid') return null
    const now = new Date()
    const digital = order.kind === 'digital'
    await tx
      .update(orders)
      .set({
        paymentStatus: 'paid',
        paidAt: now,
        paymentProvider: info.provider ?? order.paymentProvider,
        paymentRef: info.ref ?? order.paymentRef,
        ...(digital ? { fulfillmentStatus: 'delivered' as const, deliveredAt: now } : {}),
      })
      .where(eq(orders.id, orderId))
    await tx.insert(orderEvents).values({
      orderId,
      type: 'payment_paid',
      message: info.note ?? (info.provider ? `Paiement confirmé (${info.provider})` : 'Paiement confirmé'),
      data: { provider: info.provider, ref: info.ref },
      userId: info.userId ?? null,
    })
    await convertLeads(tx, order)
    return order
  })
  if (changed) await enqueue('order.paid', { orderId })
  return changed !== null
}

async function convertLeads(tx: Tx, order: Order) {
  const conds = [eq(leads.storeId, order.storeId), isNull(leads.convertedAt)]
  const who = order.customerEmail ? eq(leads.email, order.customerEmail) : order.customerPhone ? eq(leads.phone, order.customerPhone) : null
  if (!who) return
  await tx
    .update(leads)
    .set({ convertedAt: new Date(), convertedOrderId: order.id, nextReminderAt: null })
    .where(and(...conds, who))
}

const STATUS_TIMESTAMP: Partial<Record<FulfillmentStatus, keyof Order>> = {
  confirmed: 'confirmedAt',
  shipped: 'shippedAt',
  delivered: 'deliveredAt',
  cancelled: 'cancelledAt',
  returned: 'returnedAt',
}

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  unreachable: 'Injoignable',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  returned: 'Retournée',
  cancelled: 'Annulée',
}

/** Change le statut logistique en respectant la machine d'état. */
export async function transitionFulfillment(
  store: Store,
  orderId: string,
  to: FulfillmentStatus,
  opts: { userId: number; note?: string; courier?: string; trackingNumber?: string },
) {
  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
      .for('update')
      .limit(1)
    if (!order) throw notFound('Commande')
    const from = order.fulfillmentStatus
    if (!FULFILLMENT_TRANSITIONS[from].includes(to)) {
      throw conflict(`Passage « ${STATUS_LABEL[from]} » → « ${STATUS_LABEL[to]} » impossible`, 'invalid_transition')
    }
    const now = new Date()
    const tsField = STATUS_TIMESTAMP[to]
    const patch: Partial<typeof orders.$inferInsert> = { fulfillmentStatus: to }
    if (tsField) (patch as Record<string, unknown>)[tsField] = now
    if (to === 'unreachable') patch.callAttempts = order.callAttempts + 1
    if (opts.courier) patch.courier = opts.courier
    if (opts.trackingNumber) patch.trackingNumber = opts.trackingNumber

    // COD livrée = encaissée.
    let becamePaid = false
    if (to === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
      patch.paymentStatus = 'paid'
      patch.paidAt = now
      becamePaid = true
    }
    await tx.update(orders).set(patch).where(eq(orders.id, order.id))

    // Stock rendu si la marchandise revient ou n'est jamais partie.
    if ((to === 'cancelled' || to === 'returned') && from !== 'cancelled') await restock(tx, order.id)
    if (from === 'cancelled' && to === 'new') await restock(tx, order.id, -1)

    if (order.customerId) {
      if (to === 'delivered') {
        await tx
          .update(customers)
          .set({ deliveredCount: dsql`${customers.deliveredCount} + 1`, totalSpent: dsql`${customers.totalSpent} + ${order.total}` })
          .where(eq(customers.id, order.customerId))
      }
      if (to === 'returned') {
        await tx.update(customers).set({ returnedCount: dsql`${customers.returnedCount} + 1` }).where(eq(customers.id, order.customerId))
      }
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      type: 'status',
      message: opts.note ?? `${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`,
      data: { from, to, courier: opts.courier, trackingNumber: opts.trackingNumber },
      userId: opts.userId,
    })
    if (becamePaid) await convertLeads(tx, order)
    return { becamePaid }
  })
  if (result.becamePaid) await enqueue('order.paid', { orderId })
}

async function restock(tx: Tx, orderId: string, sign: 1 | -1 = 1) {
  const items = await tx
    .select({ item: orderItems, track: products.trackInventory })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId))
  for (const { item, track } of items) {
    if (!track || item.productType !== 'physical') continue
    const delta = item.quantity * sign
    if (item.variantId) {
      await tx
        .update(productVariants)
        .set({ stock: dsql`${productVariants.stock} + ${delta}` })
        .where(and(eq(productVariants.id, item.variantId), dsql`${productVariants.stock} is not null`))
    } else if (item.productId) {
      await tx
        .update(products)
        .set({ stock: dsql`${products.stock} + ${delta}` })
        .where(and(eq(products.id, item.productId), dsql`${products.stock} is not null`))
    }
  }
}

export async function setPaymentStatus(store: Store, orderId: string, status: PaymentStatus, userId: number, note?: string) {
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.storeId, store.id))).limit(1)
  if (!order) throw notFound('Commande')
  if (status === 'paid') return markOrderPaid(orderId, { userId, note: note ?? 'Paiement marqué reçu manuellement' })
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ paymentStatus: status }).where(eq(orders.id, orderId))
    await tx.insert(orderEvents).values({ orderId, type: `payment_${status}`, message: note ?? `Paiement : ${status}`, userId })
  })
  return true
}
