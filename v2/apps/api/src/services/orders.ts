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
import { displayPrice, quote, roundMoney, shippingFee } from './pricing'

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
type ProductRow = typeof products.$inferSelect
type VariantRow = typeof productVariants.$inferSelect
type BundleSnapshot = { productId: string; variantId: number | null; name: string; quantity: number }[]

/**
 * Réserve le stock d'une ligne et calcule son prix d'achat unitaire.
 * Pack : chaque produit inclus est réservé (stock du pack = stock de ses composants), coût = somme des coûts.
 */
export async function reserveLine(tx: Tx, storeId: string, product: ProductRow, variant: VariantRow | null, quantity: number): Promise<{ unitCost: number | null; bundle: BundleSnapshot | null }> {
  const items = product.bundle?.items ?? []
  if (items.length) {
    const comps = await tx
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), inArray(products.id, items.map((i) => i.productId))))
      .for('update')
    const vIds = items.map((i) => i.variantId).filter((x): x is number => typeof x === 'number')
    const vars = vIds.length ? await tx.select().from(productVariants).where(inArray(productVariants.id, vIds)).for('update') : []
    let cost: number | null = 0
    const snapshot: BundleSnapshot = []
    for (const item of items) {
      const comp = comps.find((c) => c.id === item.productId)
      if (!comp) throw conflict('Un produit du pack n’est plus disponible', 'bundle_unavailable')
      const v = item.variantId ? (vars.find((x) => x.id === item.variantId) ?? null) : null
      const need = item.quantity * quantity
      if (comp.type === 'physical' && comp.trackInventory) {
        const available = v ? v.stock : comp.stock
        if (available != null && available < need) throw conflict(`Stock insuffisant : ${comp.name}`, 'out_of_stock')
        if (v && v.stock != null) await tx.update(productVariants).set({ stock: dsql`${productVariants.stock} - ${need}` }).where(eq(productVariants.id, v.id))
        else if (comp.stock != null) await tx.update(products).set({ stock: dsql`${products.stock} - ${need}` }).where(eq(products.id, comp.id))
      }
      const c = v?.costPrice ?? comp.costPrice ?? (comp.type === 'digital' ? 0 : null)
      cost = cost == null || c == null ? null : cost + c * item.quantity
      snapshot.push({ productId: comp.id, variantId: v?.id ?? null, name: v ? `${comp.name} (${v.name})` : comp.name, quantity: item.quantity })
    }
    return { unitCost: product.costPrice ?? cost, bundle: snapshot }
  }
  if (product.type === 'physical' && product.trackInventory) {
    const available = variant ? variant.stock : product.stock
    if (available != null && available < quantity) throw conflict('Stock insuffisant', 'out_of_stock')
    if (variant && variant.stock != null) await tx.update(productVariants).set({ stock: dsql`${productVariants.stock} - ${quantity}` }).where(eq(productVariants.id, variant.id))
    else if (product.stock != null) await tx.update(products).set({ stock: dsql`${products.stock} - ${quantity}` }).where(eq(products.id, product.id))
  }
  return { unitCost: variant?.costPrice ?? product.costPrice ?? null, bundle: null }
}

/** Charge (et verrouille) le produit d'une offre du tunnel. Les produits inactifs sont permis : un produit peut n'exister que comme offre. */
export async function loadOfferProduct(tx: Tx, storeId: string, offer: { productId: string; variantId: number | null }) {
  const [p] = await tx.select().from(products).where(and(eq(products.id, offer.productId), eq(products.storeId, storeId))).for('update').limit(1)
  if (!p) throw conflict('Cette offre n’est plus disponible', 'offer_unavailable')
  const v = offer.variantId ? ((await tx.select().from(productVariants).where(and(eq(productVariants.id, offer.variantId), eq(productVariants.productId, p.id))).limit(1))[0] ?? null) : null
  return { product: p, variant: v }
}

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
      // Compte Payment Orchestrator de la plateforme (boutiques du super admin) : pas de ligne en base.
      const online = account ? await (await import('./platform')).storeOnlinePayments(store.id) : false
      if (!online && !(await (await import('./po')).poAccount(store.id))) throw badRequest('Le paiement en ligne n’est pas activé pour cette boutique', 'payments_disabled')
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

    // Stock : réservé à la commande, rendu en cas d'annulation/retour (pack : chaque produit inclus).
    const mainLine = await reserveLine(tx, store.id, product, variant ?? null, q.quantity)

    // Order bump : case cochée par le client, prix fixé par le vendeur (jamais par le navigateur).
    const bumpOffer = input.bump && product.funnel?.bump ? product.funnel.bump : null
    let bump: { offer: NonNullable<typeof bumpOffer>; product: ProductRow; variant: VariantRow | null; line: Awaited<ReturnType<typeof reserveLine>>; price: number } | null = null
    if (bumpOffer) {
      const loaded = await loadOfferProduct(tx, store.id, bumpOffer)
      const line = await reserveLine(tx, store.id, loaded.product, loaded.variant, 1)
      bump = { offer: bumpOffer, ...loaded, line, price: roundMoney(bumpOffer.price, q.currency) }
    }
    const bumpAmount = bump?.price ?? 0

    // Panier : autres produits de la même boutique dans la même commande. Prix et stock relus ici, jamais ceux du navigateur.
    const extras: { product: ProductRow; variant: VariantRow | null; quantity: number; unitPrice: number; total: number; line: Awaited<ReturnType<typeof reserveLine>> }[] = []
    if (input.extraItems?.length && !(await (await import('./platform')).storeCartAllowed(store.id))) throw badRequest('Le panier n’est pas disponible pour cette boutique', 'cart_disabled')
    for (const it of input.extraItems ?? []) {
      if (it.productId === product.id && (it.variantId ?? null) === (variant?.id ?? null)) continue
      const [p2] = await tx.select().from(products).where(and(eq(products.id, it.productId), eq(products.storeId, store.id))).for('update').limit(1)
      if (!p2 || !p2.isActive) throw badRequest('Un produit du panier n’est plus disponible', 'cart_item_unavailable')
      if (p2.type !== product.type) throw badRequest('Produits physiques et digitaux se commandent séparément', 'cart_mixed')
      if (p2.payment.method !== product.payment.method) throw badRequest('Ces produits ne se paient pas de la même façon : commandez-les séparément', 'cart_payment_mismatch')
      const v2 = it.variantId ? (await tx.select().from(productVariants).where(and(eq(productVariants.id, it.variantId), eq(productVariants.productId, p2.id))).for('update').limit(1))[0] : undefined
      if (it.variantId && (!v2 || !v2.isActive)) throw badRequest('Une variante du panier est indisponible', 'cart_item_unavailable')
      const unit = displayPrice(p2, store.currency, v2 ?? null)
      if (unit.currency !== q.currency) throw badRequest('Produits dans des devises différentes : commandez-les séparément', 'cart_currency')
      const quantity = isPhysical ? it.quantity : 1
      const line = await reserveLine(tx, store.id, p2, v2 ?? null, quantity)
      const unitPrice = roundMoney(unit.effective, q.currency)
      extras.push({ product: p2, variant: v2 ?? null, quantity, unitPrice, total: roundMoney(unitPrice * quantity, q.currency), line })
    }
    const extraAmount = extras.reduce((sum, x) => sum + x.total, 0)
    // Livraison offerte au-delà d'un montant : calculée sur tout le panier.
    const shipping = extras.length && zone ? shippingFee(zone, q.subtotal - q.discount + extraAmount + bumpAmount) : q.shippingFee

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
        // Coûts réels (bénéfice) : ce que le livreur facture, et un éventuel retour.
        deliveryCost: isPhysical ? (zone?.courierCost ?? null) : null,
        returnCost: isPhysical ? (zone?.returnCost ?? null) : null,
        customerNote: input.note ?? null,
        kind: product.type,
        subtotal: roundMoney(q.subtotal + bumpAmount + extraAmount, q.currency),
        discount: q.discount,
        shippingFee: shipping,
        total: roundMoney(q.total - q.shippingFee + shipping + bumpAmount + extraAmount, q.currency),
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
        visitorId: input.visitorId,
        eventId: input.eventId ?? randomToken(16),
        trackingContext: { ip: ctx.ip, userAgent: ctx.userAgent, fbp: input.fbp, fbc: input.fbc },
        metadata:
          customer.isBlocked || custom.answers.length || product.funnel
            ? {
                ...(customer.isBlocked ? { flagged: 'blocked_customer' } : {}),
                ...(custom.answers.length ? { customFields: custom.answers } : {}),
                // Tunnel : ce qui a été proposé et accepté (statistiques de conversion).
                ...(product.funnel ? { funnel: { bumpOffered: Boolean(product.funnel.bump), bumpAccepted: Boolean(bump), answers: {} as Record<string, 'accepted' | 'declined'> } } : {}),
              }
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
      unitCost: mainLine.unitCost,
      bundle: mainLine.bundle,
      total: q.subtotal,
    })
    if (bump) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: bump.product.id,
        variantId: bump.variant?.id ?? null,
        productType: bump.product.type,
        name: bump.product.name,
        variantName: bump.variant?.name ?? null,
        quantity: 1,
        unitPrice: bump.price,
        unitCost: bump.line.unitCost,
        bundle: bump.line.bundle,
        role: 'bump',
        total: bump.price,
      })
    }

    for (const x of extras) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: x.product.id,
        variantId: x.variant?.id ?? null,
        productType: x.product.type,
        name: x.product.name,
        variantName: x.variant?.name ?? null,
        quantity: x.quantity,
        unitPrice: x.unitPrice,
        unitCost: x.line.unitCost,
        bundle: x.line.bundle,
        total: x.total,
      })
    }

    if (order.promoCodeId) {
      await tx.update(promoCodes).set({ usedCount: dsql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.id, order.promoCodeId))
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      type: 'created',
      message: paymentMethod === 'cod' ? 'Commande reçue (paiement à la livraison)' : 'Commande créée',
      data: { quantity: q.quantity, offerId: q.offerId, total: q.total, ...(extras.length ? { cartItems: extras.length + 1 } : {}) },
    })

    return { order, promoError: q.promoError, store }
  })

  if (result.order.paymentMethod === 'cod') {
    // Une commande COD est une vente (à confirmer) : on notifie tout de suite.
    // Avec des upsells, on attend la fin du tunnel (total final) ; filet de sécurité à 5 min si le client part.
    const hasUpsells = Boolean((await db.select({ funnel: products.funnel }).from(products).where(eq(products.id, input.productId)).limit(1))[0]?.funnel?.upsells.length)
    await enqueue('order.notify-new', { orderId: result.order.id }, hasUpsells ? { startAfter: 300 } : {})
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
  // Paiement à la livraison : achat déclaré à Meta à la confirmation ou à la livraison si le vendeur l'a choisi
  // (la tâche vérifie le réglage, l'envoi n'a lieu qu'une fois).
  if (to === 'confirmed' || to === 'delivered') await enqueue('order.capi-purchase', { orderId, stage: to }, { singletonKey: `order.capi-purchase:${orderId}:${to}` })
  // Email de suivi au client : commande confirmée, colis en route.
  if (to === 'confirmed' || to === 'shipped') await enqueue('order.customer-status', { orderId, status: to }, { singletonKey: `order.customer-status:${orderId}:${to}` })
  // Commande annulée avant paiement : la session Payment Orchestrator ne doit plus être payable.
  if (to === 'cancelled') {
    void (await import('./po')).expireOrderSession(orderId).catch((e) => console.warn('[po] expiration', (e as Error).message))
  }
}

async function restock(tx: Tx, orderId: string, sign: 1 | -1 = 1) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  // Pack : on rend le stock de chaque produit inclus (contenu figé à la commande).
  const lines = items.flatMap((item) =>
    item.bundle?.length
      ? item.bundle.map((b) => ({ productId: b.productId, variantId: b.variantId, quantity: b.quantity * item.quantity }))
      : [{ productId: item.productId, variantId: item.variantId, quantity: item.quantity }],
  )
  const ids = [...new Set(lines.map((l) => l.productId).filter((x): x is string => !!x))]
  if (!ids.length) return
  const tracked = new Map((await tx.select({ id: products.id, track: products.trackInventory, type: products.type }).from(products).where(inArray(products.id, ids))).map((p) => [p.id, p]))
  for (const l of lines) {
    const p = l.productId ? tracked.get(l.productId) : undefined
    if (!p || !p.track || p.type !== 'physical') continue
    const delta = l.quantity * sign
    if (l.variantId) {
      await tx
        .update(productVariants)
        .set({ stock: dsql`${productVariants.stock} + ${delta}` })
        .where(and(eq(productVariants.id, l.variantId), dsql`${productVariants.stock} is not null`))
    } else {
      await tx
        .update(products)
        .set({ stock: dsql`${products.stock} + ${delta}` })
        .where(and(eq(products.id, p.id), dsql`${products.stock} is not null`))
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

const FUNNEL_WINDOW_MS = 30 * 60_000

/**
 * Réponse du client à une offre du tunnel (upsell / downsell), juste après sa commande.
 * Accepter ajoute le produit à la MÊME commande (en COD : le livreur encaisse le tout ; en paiement
 * en ligne : avant le paiement, un seul paiement). Prix fixé par le vendeur, jamais par le navigateur.
 */
export async function answerFunnelOffer(token: string, input: { offerId: string; accept: boolean; last?: boolean }) {
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.accessToken, token)).for('update').limit(1)
    if (!order) throw notFound('Commande')
    if (Date.now() - order.createdAt.getTime() > FUNNEL_WINDOW_MS) throw conflict('Cette offre a expiré', 'offer_expired')
    if (order.paymentStatus === 'paid' || order.fulfillmentStatus !== 'new' || order.paymentMethod === 'external') throw conflict('Cette commande ne peut plus être modifiée', 'order_locked')
    const [main] = await tx.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.role, 'main'))).limit(1)
    const [mainProduct] = main?.productId ? await tx.select({ funnel: products.funnel }).from(products).where(eq(products.id, main.productId)).limit(1) : []
    const upsells = mainProduct?.funnel?.upsells ?? []
    let found: { offer: (typeof upsells)[number] | NonNullable<(typeof upsells)[number]['downsell']>; role: 'upsell' | 'downsell'; parentId: string | null } | null = null
    for (const u of upsells) {
      if (u.id === input.offerId) found = { offer: u, role: 'upsell', parentId: null }
      else if (u.downsell?.id === input.offerId) found = { offer: u.downsell, role: 'downsell', parentId: u.id }
    }
    if (!found) throw notFound('Offre')
    const meta = (order.metadata ?? {}) as { funnel?: { bumpOffered?: boolean; bumpAccepted?: boolean; answers?: Record<string, 'accepted' | 'declined'> } }
    const answers = { ...(meta.funnel?.answers ?? {}) }
    // Déjà répondu (double clic, retour arrière) : réponse idempotente.
    if (answers[found.offer.id]) return { order, accepted: answers[found.offer.id] === 'accepted', changed: false }
    if (found.role === 'downsell' && answers[found.parentId!] !== 'declined') throw conflict('Offre indisponible', 'offer_unavailable')

    let updated = order
    if (input.accept) {
      const loaded = await loadOfferProduct(tx, order.storeId, found.offer)
      const line = await reserveLine(tx, order.storeId, loaded.product, loaded.variant, 1)
      const price = roundMoney(found.offer.price, order.currency)
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: loaded.product.id,
        variantId: loaded.variant?.id ?? null,
        productType: loaded.product.type,
        name: loaded.product.name,
        variantName: loaded.variant?.name ?? null,
        quantity: 1,
        unitPrice: price,
        unitCost: line.unitCost,
        bundle: line.bundle,
        role: found.role,
        total: price,
      })
      const kinds = new Set([order.kind, loaded.product.type])
      const [u] = await tx
        .update(orders)
        .set({ subtotal: roundMoney(order.subtotal + price, order.currency), total: roundMoney(order.total + price, order.currency), kind: kinds.size > 1 ? 'mixed' : order.kind })
        .where(eq(orders.id, order.id))
        .returning()
      updated = u!
    }
    answers[found.offer.id] = input.accept ? 'accepted' : 'declined'
    const [withAnswer] = await tx
      .update(orders)
      .set({ metadata: { ...(updated.metadata ?? {}), funnel: { ...(meta.funnel ?? {}), answers } } })
      .where(eq(orders.id, order.id))
      .returning()
    updated = withAnswer!
    await tx.insert(orderEvents).values({
      orderId: order.id,
      type: input.accept ? `${found.role}_accepted` : `${found.role}_declined`,
      message: input.accept ? `${found.role === 'upsell' ? 'Upsell' : 'Offre de repli'} acceptée : ${found.offer.title} (+${found.offer.price})` : `${found.role === 'upsell' ? 'Upsell' : 'Offre de repli'} refusée : ${found.offer.title}`,
      data: { offerId: found.offer.id, price: found.offer.price },
    })
    return { order: updated, accepted: input.accept, changed: true }
  })
  // Fin du tunnel : le vendeur est prévenu tout de suite, avec le total final (COD).
  if (input.last && result.order.paymentMethod === 'cod') await enqueue('order.notify-new', { orderId: result.order.id }, { singletonKey: `order.notify-new:${result.order.id}:final` })
  const o = result.order
  return { accepted: result.accepted, order: { token: o.accessToken, orderNumber: o.orderNumber, total: o.total, currency: o.currency, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, eventId: o.eventId } }
}
