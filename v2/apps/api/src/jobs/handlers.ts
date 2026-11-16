import { and, asc, eq, isNull, lte, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { checkoutSettings, leads, orderItems, orders, products, promoCodes, stores } from '../db/schema'
import { decrypt } from '../lib/crypto'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { abandonedCartEmail, digitalReceiptEmail, formatMoney, physicalConfirmationEmail, sellerNewOrderEmail } from '../services/emails'
import { sendCapiEvent, sendEmail, sendTelegram } from '../services/notify'

const storefrontUrl = (slug: string, path = '') => `${env.STOREFRONT_URL.replace(/\/$/, '')}/${slug}${path}`
const orderUrl = (slug: string, token: string) => storefrontUrl(slug, `/order/${token}`)

async function loadOrder(orderId: number) {
  const [row] = await db.select({ order: orders, store: stores }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(eq(orders.id, orderId)).limit(1)
  if (!row) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const [cfg] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, row.store.id)).limit(1)
  const lines = items.map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
  return { ...row, items, lines, cfg }
}
type Loaded = NonNullable<Awaited<ReturnType<typeof loadOrder>>>

async function capiPurchase(o: Loaded) {
  const pixelId = o.cfg?.facebookPixelId
  const tokenEnc = o.cfg?.facebookAccessTokenEnc
  if (!pixelId || !tokenEnc) return
  await sendCapiEvent({
    pixelId,
    accessToken: decrypt(tokenEnc),
    testEventCode: o.cfg?.facebookTestEventCode,
    eventName: 'Purchase',
    eventId: o.order.eventId,
    eventTime: o.order.createdAt,
    sourceUrl: o.items[0]?.productId ? storefrontUrl(o.store.slug, `/p/${o.items[0].productId}`) : undefined,
    value: o.order.total,
    currency: o.order.currency,
    user: {
      email: o.order.customerEmail,
      phone: o.order.customerPhone,
      firstName: o.order.customerName?.split(' ')[0],
      city: o.order.city,
      country: o.store.country,
      ...o.order.trackingContext,
    },
    contentIds: o.items.map((i) => String(i.productId)),
  })
}

async function notifySeller(o: Loaded, headline: string) {
  const methodLabel = o.order.paymentMethod === 'cod' ? 'Paiement à la livraison' : o.order.paymentProvider ?? o.order.paymentMethod
  await sendTelegram(
    `${headline} <b>${escapeHtml(o.store.name)}</b>\n` +
      `${o.lines.map(escapeHtml).join('\n')}\n` +
      `💰 ${escapeHtml(formatMoney(o.order.total, o.order.currency))} — ${escapeHtml(methodLabel)}\n` +
      `👤 ${escapeHtml(o.order.customerName)} ${escapeHtml(o.order.customerPhone)}${o.order.city ? `\n📍 ${escapeHtml(o.order.city)}` : ''}`,
  )
}

/** Commande payée (en ligne, ou COD livrée). Exécuté au plus une fois par commande. */
export async function handleOrderPaid({ orderId }: { orderId: number }) {
  // Verrou d'idempotence : seul le premier passage obtient la ligne.
  const [claimed] = await db
    .update(orders)
    .set({ fulfilledEffectsAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.fulfilledEffectsAt)))
    .returning({ id: orders.id })
  if (!claimed) return
  const o = await loadOrder(orderId)
  if (!o) return
  const tasks: Promise<unknown>[] = []

  if (o.order.paymentMethod !== 'cod') {
    // Les commandes COD ont déjà été notifiées et envoyées à la CAPI à leur création.
    tasks.push(capiPurchase(o), notifySeller(o, '✅ Vente payée'))
    if (o.order.customerEmail && o.order.kind !== 'physical') {
      const mail = digitalReceiptEmail({ storeName: o.store.name, customerName: o.order.customerName, orderNumber: o.order.orderNumber, items: o.lines, total: o.order.total, currency: o.order.currency, accessUrl: orderUrl(o.store.slug, o.order.accessToken) })
      tasks.push(sendEmail(o.order.customerEmail, mail.subject, mail.html))
    }
  }
  const results = await Promise.allSettled(tasks)
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length) {
    // On libère le verrou pour que pg-boss réessaie (les envois réussis peuvent être répétés : acceptable).
    await db.update(orders).set({ fulfilledEffectsAt: null }).where(eq(orders.id, orderId))
    throw new Error(`order.paid: ${failed.length} envoi(s) en échec — ${failed.map((f) => (f as PromiseRejectedResult).reason).join('; ')}`)
  }
}

/** Nouvelle commande COD : notifier vendeur + client, CAPI Purchase (optimisation des pubs). */
export async function handleOrderNotifyNew({ orderId }: { orderId: number }) {
  const o = await loadOrder(orderId)
  if (!o) return
  const tasks: Promise<unknown>[] = [notifySeller(o, '🛒 Nouvelle commande COD'), capiPurchase(o)]
  if (o.order.customerEmail) {
    const mail = physicalConfirmationEmail({ storeName: o.store.name, customerName: o.order.customerName, orderNumber: o.order.orderNumber, items: o.lines, total: o.order.total, currency: o.order.currency, cod: true, trackUrl: orderUrl(o.store.slug, o.order.accessToken) })
    tasks.push(sendEmail(o.order.customerEmail, mail.subject, mail.html))
  }
  if (o.store.supportEmail) {
    const mail = sellerNewOrderEmail({ storeName: o.store.name, orderNumber: o.order.orderNumber, customer: o.order.customerName ?? '', phone: o.order.customerPhone, items: o.lines, total: o.order.total, currency: o.order.currency, method: 'Paiement à la livraison', dashboardUrl: `${env.APP_URL}/stores/${o.store.id}/orders/${o.order.id}` })
    tasks.push(sendEmail(o.store.supportEmail, mail.subject, mail.html))
  }
  const failed = (await Promise.allSettled(tasks)).filter((r) => r.status === 'rejected')
  if (failed.length) console.warn(`[order.notify-new] ${failed.length} envoi(s) en échec`, failed)
}

const REMINDER_DELAYS_H = [1, 24, 72]

/**
 * Relances panier abandonné : traite les leads arrivés à échéance, par ordre
 * d'échéance (plus de famine comme avec l'ancien `limit(50)` non trié).
 */
export async function handleLeadsRemind() {
  const due = await db
    .select({ lead: leads, store: stores, productName: products.name, cfg: checkoutSettings.settings })
    .from(leads)
    .innerJoin(stores, eq(stores.id, leads.storeId))
    .innerJoin(products, eq(products.id, leads.productId))
    .leftJoin(checkoutSettings, eq(checkoutSettings.storeId, leads.storeId))
    .where(and(isNull(leads.convertedAt), lte(leads.nextReminderAt, new Date()), dsql`${leads.email} is not null`))
    .orderBy(asc(leads.nextReminderAt))
    .limit(200)

  for (const { lead, store, productName, cfg } of due) {
    if (!cfg?.abandonedCart.enabled) {
      await db.update(leads).set({ nextReminderAt: null }).where(eq(leads.id, lead.id))
      continue
    }
    // A-t-il commandé entre-temps ?
    const [bought] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.storeId, store.id), eq(orders.customerEmail, lead.email!), dsql`(${orders.paymentStatus} = 'paid' or ${orders.paymentMethod} = 'cod')`, dsql`${orders.createdAt} >= ${lead.createdAt}`))
      .limit(1)
    if (bought) {
      await db.update(leads).set({ convertedAt: new Date(), convertedOrderId: bought.id, nextReminderAt: null }).where(eq(leads.id, lead.id))
      continue
    }
    const step = lead.reminderCount + 1
    let promo: { code: string; label: string } | undefined
    if (step >= 2 && cfg.abandonedCart.promoCodeId) {
      const [code] = await db.select().from(promoCodes).where(and(eq(promoCodes.id, cfg.abandonedCart.promoCodeId), eq(promoCodes.storeId, store.id), eq(promoCodes.isActive, true))).limit(1)
      if (code) promo = { code: code.code, label: code.type === 'percentage' ? `-${code.value}%` : `-${formatMoney(code.value, store.currency)}` }
    }
    const url = storefrontUrl(store.slug, `/p/${lead.productId}${promo ? `?promo=${encodeURIComponent(promo.code)}` : ''}`)
    const mail = abandonedCartEmail({ step, storeName: store.name, name: lead.name, product: productName, url, promo })
    await sendEmail(lead.email!, mail.subject, mail.html)
    const nextDelay = REMINDER_DELAYS_H[step]
    await db
      .update(leads)
      .set({
        reminderCount: step,
        lastRemindedAt: new Date(),
        nextReminderAt: nextDelay ? new Date(lead.createdAt.getTime() + nextDelay * 3600_000) : null,
        reminderHistory: [...lead.reminderHistory, { step, channel: 'email', at: new Date().toISOString(), promoCode: promo?.code }],
      })
      .where(eq(leads.id, lead.id))
  }
  return { processed: due.length }
}
