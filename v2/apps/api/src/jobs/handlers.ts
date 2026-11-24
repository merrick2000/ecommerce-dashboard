import { and, asc, eq, gte, inArray, isNull, lte, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { checkoutSettings, deliveryZones, leads, orderItems, orders, products, promoCodes, stores, users } from '../db/schema'
import { decrypt } from '../lib/crypto'
import { env } from '../lib/env'
import { abandonedCartEmail, formatMoney } from '../services/emails'
import { notifyPlatformAdmins } from '../services/admin-notify'
import { customerDigitalEmail, customerOrderEmail, customerStatusEmail, type EmailOrder, type SaleEmailData } from '../services/order-emails'
import { publicUrl } from '../services/storage'
import { localMidnight } from '../routes/stats'
import { sendCapiEvent, sendEmail } from '../services/notify'
import { notify } from '../services/notifications'
import { sendAccountNotice, type AccountNotice } from '../services/account'

const storefrontUrl = (slug: string, path = '') => `${env.STOREFRONT_URL.replace(/\/$/, '')}/${slug}${path}`
export const orderUrl = (slug: string, token: string) => storefrontUrl(slug, `/order/${token}`)

export async function loadOrder(orderId: string) {
  const [row] = await db.select({ order: orders, store: stores }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(eq(orders.id, orderId)).limit(1)
  if (!row) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const [cfg] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, row.store.id)).limit(1)
  const lines = items.map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
  return { ...row, items, lines, cfg }
}
type Loaded = NonNullable<Awaited<ReturnType<typeof loadOrder>>>

/** Données communes aux emails de commande : photos des produits, couleur de la boutique, délai, moyen de paiement réel. */
export async function emailOrder(o: Loaded): Promise<EmailOrder> {
  const ids = [...new Set(o.items.map((i) => i.productId).filter((x): x is string => !!x))]
  const imgs = ids.length ? await db.select({ id: products.id, thumbnail: products.thumbnail, cover: products.coverImage }).from(products).where(inArray(products.id, ids)) : []
  const img = new Map(imgs.map((p) => [p.id, publicUrl(p.thumbnail ?? p.cover)]))
  const [zone] = o.order.deliveryZoneId ? await db.select({ eta: deliveryZones.etaLabel }).from(deliveryZones).where(eq(deliveryZones.id, o.order.deliveryZoneId)).limit(1) : []
  const order = o.order
  const en = o.store.locale === 'en'
  const online = en ? 'Online payment' : 'Paiement en ligne'
  const paymentLabel =
    order.paymentMethod === 'cod'
      ? en
        ? 'Cash on delivery'
        : 'Paiement à la livraison'
      : order.poOperator
        ? `${order.poOperator.toUpperCase()} Mobile Money`
        : order.paymentProvider
          ? `${online} (${order.paymentProvider})`
          : online
  return {
    storeName: o.store.name,
    color: o.cfg?.settings.primaryColor ?? '#f59e0b',
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    city: order.city,
    address: order.address,
    note: order.customerNote,
    items: o.items.map((i) => ({ name: i.name, variant: i.variantName, quantity: i.quantity, total: Number(i.total), image: i.productId ? (img.get(i.productId) ?? null) : null, role: i.role, bundle: i.bundle?.map((b) => (b.quantity > 1 ? `${b.quantity} x ${b.name}` : b.name)) ?? null })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingFee: Number(order.shippingFee),
    total: Number(order.total),
    currency: order.currency,
    cod: order.paymentMethod === 'cod',
    digital: order.kind === 'digital',
    paymentLabel,
    support: { phone: o.store.supportPhone, email: o.store.supportEmail },
    trackUrl: orderUrl(o.store.slug, order.accessToken),
    etaLabel: zone?.eta ?? null,
    lang: en ? 'en' : 'fr',
  }
}

/** Email client adapté : accès au produit (digital payé) ou confirmation de commande (physique). */
async function customerConfirmation(o: Loaded) {
  const data = await emailOrder(o)
  return o.order.kind === 'digital' && o.order.paymentStatus === 'paid' ? customerDigitalEmail({ ...data, accessUrl: orderUrl(o.store.slug, o.order.accessToken) }) : customerOrderEmail(data)
}

/** Bilan du jour de la boutique (fuseau de la boutique), pour l'email « nouvelle vente ». */
async function todayStats(storeId: string, tz: string) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const start = localMidnight(day, tz)
  const [r] = await db
    .select({ n: dsql<number>`count(*)::int`, revenue: dsql<number>`coalesce(sum(${orders.total}) filter (where ${orders.fulfillmentStatus} not in ('cancelled','returned')), 0)::float` })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), gte(orders.createdAt, start)))
  return { orders: Number(r?.n ?? 0), revenue: Number(r?.revenue ?? 0) }
}

/**
 * Événement déclaré à Meta pour une commande qui vient d'arriver : Purchase, sauf en paiement à la livraison
 * quand le vendeur a choisi de ne déclarer l'achat qu'à la confirmation ou à la livraison (alors Lead).
 */
export const arrivalEvent = (o: { paymentMethod: string }, codPurchaseOn: string | null | undefined): 'Purchase' | 'Lead' =>
  o.paymentMethod === 'cod' && codPurchaseOn && codPurchaseOn !== 'created' ? 'Lead' : 'Purchase'

async function capiPurchase(o: Loaded, eventName: 'Purchase' | 'Lead' = 'Purchase', eventTime: Date = o.order.createdAt) {
  const pixelId = o.cfg?.facebookPixelId
  const tokenEnc = o.cfg?.facebookAccessTokenEnc
  if (!pixelId || !tokenEnc) return
  await sendCapiEvent({
    pixelId,
    accessToken: decrypt(tokenEnc),
    testEventCode: o.cfg?.facebookTestEventCode,
    eventName,
    eventId: o.order.eventId,
    eventTime,
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

/** Emails au client : expéditeur = nom de la boutique, réponses vers l'email de support. */
export const customerMailOpts = (o: Loaded) => ({ fromName: o.store.name, replyTo: o.store.supportEmail })
/**
 * Prévient l'équipe (push / email / Telegram selon les réglages de chacun),
 * uniquement les membres qui ont accès aux produits de la commande.
 */
async function notifyTeam(o: Loaded, event: 'order.new' | 'order.paid') {
  const method = o.order.paymentMethod === 'cod' ? 'à la livraison' : (o.order.paymentProvider ?? 'en ligne')
  const who = [o.order.customerName, o.order.city].filter(Boolean).join(', ')
  const what = o.lines.join(', ')
  const base = `${who} · ${what}`
  const sale: SaleEmailData = { ...(await emailOrder(o)), dashboardUrl: `${env.APP_URL.replace(/\/$/, '')}/stores/${o.store.id}/orders/${o.order.id}`, today: await todayStats(o.store.id, o.store.timezone) }
  await notify(o.store.id, event, {
    title: event === 'order.new' ? `Nouvelle commande ${o.order.orderNumber}` : `Nouvelle vente : paiement reçu ${o.order.orderNumber}`,
    sale,
    body: base,
    bodyWithAmount: `${base} · ${formatMoney(o.order.total, o.order.currency)} (${method})`,
    path: `/stores/${o.store.id}/orders/${o.order.id}`,
    productIds: [...new Set(o.items.map((i) => i.productId).filter((x): x is string => !!x))],
    tag: `order-${o.order.id}`,
    sound: 'sale',
  })
}

/** Commande payée (en ligne, ou COD livrée). Exécuté au plus une fois par commande. */
export async function handleOrderPaid({ orderId }: { orderId: string }) {
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
    tasks.push(capiPurchase(o), notifyTeam(o, 'order.paid'))
    if (o.order.customerEmail) {
      const mail = await customerConfirmation(o)
      tasks.push(sendEmail(o.order.customerEmail, mail.subject, mail.html, customerMailOpts(o)))
    }
  }
  const results = await Promise.allSettled(tasks)
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length) {
    // On libère le verrou pour que pg-boss réessaie (les envois réussis peuvent être répétés : acceptable).
    await db.update(orders).set({ fulfilledEffectsAt: null }).where(eq(orders.id, orderId))
    throw new Error(`order.paid: ${failed.length} envoi(s) en échec, ${failed.map((f) => (f as PromiseRejectedResult).reason).join('; ')}`)
  }
}

/** Nouvelle commande COD : notifier vendeur + client, CAPI Purchase (optimisation des pubs). */
export async function handleOrderNotifyNew({ orderId }: { orderId: string }) {
  // Une seule notification par commande : la fin du tunnel et le filet de sécurité (5 min) peuvent tous deux arriver.
  const [claimed] = await db
    .update(orders)
    .set({ metadata: dsql`coalesce(${orders.metadata}, '{}'::jsonb) || '{"notified": true}'::jsonb` })
    .where(and(eq(orders.id, orderId), dsql`coalesce((${orders.metadata}->>'notified')::boolean, false) = false`))
    .returning({ id: orders.id })
  if (!claimed) return
  const o = await loadOrder(orderId)
  if (!o) return
  const tasks: Promise<unknown>[] = [notifyTeam(o, 'order.new'), capiPurchase(o, arrivalEvent(o.order, o.cfg?.codPurchaseOn))]
  if (o.order.customerEmail) {
    const mail = await customerConfirmation(o)
    tasks.push(sendEmail(o.order.customerEmail, mail.subject, mail.html, customerMailOpts(o)))
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
    .where(and(isNull(leads.convertedAt), isNull(leads.ignoredAt), lte(leads.nextReminderAt, new Date()), dsql`${leads.email} is not null`))
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
    const mail = abandonedCartEmail({ step, storeName: store.name, name: lead.name, product: productName, url, promo, lang: store.locale === 'en' ? 'en' : 'fr' })
    await sendEmail(lead.email!, mail.subject, mail.html, { fromName: store.name, replyTo: store.supportEmail })
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

/** Emails de compte (bienvenue, nouvelle connexion, mot de passe modifié). */
export async function handleAccountNotify(notice: AccountNotice) {
  const [user] = await db.select().from(users).where(eq(users.id, notice.userId)).limit(1)
  if (!user) return
  await sendAccountNotice(user, notice)
  // Nouvel inscrit : le super admin est prévenu (provenance et page d'origine pour savoir ce qui marche).
  if (notice.kind === 'welcome' && user.signupSource?.method !== 'invite') {
    const src = user.signupSource
    const origin = src?.utmSource ?? src?.referrer?.replace(/^www\./, '') ?? (src?.landing || src?.from ? 'accès direct' : 'provenance inconnue')
    await notifyPlatformAdmins({
      title: 'Nouvel inscrit sur Zuri',
      body: `${user.name} (${user.email}) · ${origin}${src?.from ? `, depuis ${src.from}` : ''}`,
      path: `/admin/users/${user.id}`,
      tag: `signup-${user.id}`,
    })
  }
}

/**
 * Paniers abandonnés : prévient l'équipe (closers compris, s'ils ont le produit)
 * 20 minutes après le début d'une commande non terminée, une seule fois par panier.
 */
export async function handleLeadsNotifySellers() {
  const now = Date.now()
  const due = await db
    .select({ lead: leads, productName: products.name })
    .from(leads)
    .innerJoin(products, eq(products.id, leads.productId))
    .where(and(isNull(leads.convertedAt), isNull(leads.ignoredAt), isNull(leads.sellerNotifiedAt), lte(leads.createdAt, new Date(now - 20 * 60_000)), gte(leads.createdAt, new Date(now - 24 * 3600_000))))
    .orderBy(asc(leads.createdAt))
    .limit(100)
  for (const { lead, productName } of due) {
    const [claimed] = await db.update(leads).set({ sellerNotifiedAt: new Date() }).where(and(eq(leads.id, lead.id), isNull(leads.sellerNotifiedAt))).returning({ id: leads.id })
    if (!claimed) continue
    const who = [lead.name ?? 'Un client', lead.phone].filter(Boolean).join(' · ')
    await notify(lead.storeId, 'lead.abandoned', {
      title: 'Panier abandonné',
      body: `${who} a commencé une commande « ${productName} » sans la terminer. Un appel peut la sauver.`,
      path: `/stores/${lead.storeId}/products/${lead.productId}`,
      productIds: lead.productId ? [lead.productId] : null,
      tag: `lead-${lead.id}`,
      sound: 'soft',
    })
  }
}

/** Suivi client : commande confirmée par la boutique, colis remis au livreur (si le client a donné un email). */
export async function handleCustomerStatus({ orderId, status }: { orderId: string; status: 'confirmed' | 'shipped' }) {
  const o = await loadOrder(orderId)
  if (!o?.order.customerEmail || o.order.kind === 'digital') return
  const mail = customerStatusEmail({ ...(await emailOrder(o)), status, courier: o.order.courier, trackingNumber: o.order.trackingNumber })
  await sendEmail(o.order.customerEmail, mail.subject, mail.html, customerMailOpts(o))
}

/**
 * Paiement à la livraison : l'achat est déclaré à Meta au moment choisi par le vendeur (confirmation ou livraison),
 * une seule fois par commande, avec l'identifiant de la commande (déduplication avec le pixel).
 */
export async function handleCapiPurchase({ orderId, stage }: { orderId: string; stage: 'confirmed' | 'delivered' }) {
  const o = await loadOrder(orderId)
  if (!o || o.order.paymentMethod !== 'cod' || o.cfg?.codPurchaseOn !== stage) return
  const [claimed] = await db
    .update(orders)
    .set({ metadata: dsql`coalesce(${orders.metadata}, '{}'::jsonb) || '{"capiPurchase": true}'::jsonb` })
    .where(and(eq(orders.id, orderId), dsql`coalesce((${orders.metadata}->>'capiPurchase')::boolean, false) = false`))
    .returning({ id: orders.id })
  if (!claimed) return
  try {
    await capiPurchase(o, 'Purchase', new Date())
  } catch (e) {
    // Échec réseau : on libère pour que la tâche soit retentée.
    await db.update(orders).set({ metadata: dsql`coalesce(${orders.metadata}, '{}'::jsonb) - 'capiPurchase'` }).where(eq(orders.id, orderId))
    throw e
  }
}
