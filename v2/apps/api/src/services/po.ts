/**
 * Payment Orchestrator (payment.zurisell.store) : paiement Mobile Money par session + widget.
 * Doc de référence : https://payment.zurisell.store/docs/integration.md
 *
 * Règles (doc, section 0) :
 * - clé secrète côté serveur uniquement (compte de la boutique chiffré en base, ou compte plateforme en variable d'env) ;
 * - une session par commande, montant calculé par le serveur, client_reference = id de commande, Idempotency-Key ;
 * - une commande n'est payée QUE sur webhook signé vérifié ou lecture serveur de la session (payment_status "paid"),
 *   avec contrôle du montant et de la devise ; jamais depuis le navigateur ni les callbacks du widget ;
 * - webhooks idempotents (po_webhook_events), signature HMAC comparée en temps constant, 300 s maximum.
 */
import { poSettingsSchema, type PoSettings } from '@zuri/shared'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, eq, gte, isNotNull, isNull, lt, or, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { orderEvents, orderItems, orders, paymentAccounts, poWebhookEvents, stores, type Order } from '../db/schema'
import { decryptJson } from '../lib/crypto'
import { getSetting, resolveFeatures } from './platform'
import { env } from '../lib/env'
import { badRequest, conflict, HttpError, notFound } from '../lib/errors'
import { markOrderPaid } from './orders'

export interface PoAccount {
  secretKey: string
  webhookSecret: string | null
  livemode: boolean
  settings: PoSettings
  /** wallet : compte de la plateforme qui encaisse pour le portefeuille de la boutique. */
  source: 'store' | 'platform' | 'wallet'
}

interface PoSession {
  id: string
  url: string
  status: 'open' | 'complete' | 'expired'
  payment_status: 'unpaid' | 'paid'
  amount: number
  currency: string
  livemode: boolean
  client_reference: string | null
  transaction: PoTransaction | null
}
interface PoTransaction {
  id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  amount: number
  currency: string
  livemode: boolean
  provider: string | null
  country: string | null
  operator: string | null
  failure_code: string | null
  failure_message: string | null
  checkout_session: string | null
  client_reference: string | null
}

export class PoError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message)
  }
}

type Creds = Partial<Record<'sandbox' | 'live', Record<string, string>>>

/**
 * Compte Payment Orchestrator d'une boutique : le sien (Paramètres > Paiements) s'il est activé,
 * sinon celui de la plateforme pour les boutiques du super admin (variables PO_SECRET_KEY / PO_WEBHOOK_SECRET).
 * Jamais le compte plateforme pour un autre vendeur : son argent irait sur le compte de la plateforme.
 */
/**
 * Compte Payment Orchestrator de la PLATEFORME (encaisse les abonnements, paie les boutiques du super admin) :
 * réglé dans Super admin > Réglages (chiffré en base), sinon variables PO_SECRET_KEY / PO_WEBHOOK_SECRET.
 */
export async function platformPo(): Promise<{ secretKey: string; webhookSecret: string | null; livemode: boolean } | null> {
  const stored = decryptJson<{ secretKey?: string; webhookSecret?: string } | null>(await getSetting<string | null>('po.platform', null), null)
  const secretKey = stored?.secretKey || env.PO_SECRET_KEY
  if (!secretKey) return null
  return { secretKey, webhookSecret: stored?.webhookSecret || env.PO_WEBHOOK_SECRET || null, livemode: secretKey.startsWith('sk_live_') }
}

export async function poAccount(storeId: string): Promise<PoAccount | null> {
  // Portefeuille ouvert par le super admin : la plateforme encaisse et reverse à la boutique.
  const [st] = await db.select({ walletEnabled: stores.walletEnabled, kind: stores.kind }).from(stores).where(eq(stores.id, storeId)).limit(1)
  if (st?.walletEnabled) {
    const platform = await platformPo()
    const [row] = await db.select({ settings: paymentAccounts.settings }).from(paymentAccounts).where(and(eq(paymentAccounts.storeId, storeId), eq(paymentAccounts.provider, 'orchestrator'))).limit(1)
    if (platform) return { ...platform, settings: poSettingsSchema.parse(row?.settings ?? {}), source: 'wallet' }
  }
  // Paiement en ligne réservé : le super admin l'ouvre à tous ou compte par compte (Super admin).
  const owner = await (await import('./platform')).storeOwner(storeId)
  if (!owner || !(await resolveFeatures(owner)).onlinePayments) return null
  const [row] = await db.select().from(paymentAccounts).where(and(eq(paymentAccounts.storeId, storeId), eq(paymentAccounts.provider, 'orchestrator'))).limit(1)
  if (row?.enabled) {
    const creds = decryptJson<Creds>(row.credentialsEnc, {})[row.mode] ?? {}
    if (creds.secretKey) {
      return { secretKey: creds.secretKey, webhookSecret: creds.webhookSecret || null, livemode: creds.secretKey.startsWith('sk_live_'), settings: poSettingsSchema.parse(row.settings ?? {}), source: 'store' }
    }
  }
  const platform = owner.isPlatformAdmin ? await platformPo() : null
  if (platform) return { ...platform, settings: poSettingsSchema.parse(row?.settings ?? {}), source: 'platform' }
  return null
}

/** Appel API Payment Orchestrator (format d'erreur : { error, error_code, status }). */
export async function po<T>(secretKey: string, path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${env.PO_BASE_URL.replace(/\/$/, '')}/api/v1${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...(init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (e) {
    throw new PoError(`Payment Orchestrator injoignable : ${(e as Error).message}`, 0, 'network_error')
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: string; error_code?: string }) | null
  if (!res.ok) throw new PoError(json?.error ?? `HTTP ${res.status}`, res.status, json?.error_code ?? 'error')
  return json as T
}

/** XOF sans décimales, autres devises 2 décimales : comparaison au centime. */
const sameAmount = (a: number, b: number) => Math.abs(Number(a) - Number(b)) < 0.005

async function loadOrderByToken(token: string) {
  const [row] = await db.select({ order: orders, store: stores }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(eq(orders.accessToken, token)).limit(1)
  if (!row) throw notFound('Commande')
  return row
}

const orderPageUrl = (storeSlug: string, token: string) => `${env.STOREFRONT_URL.replace(/\/$/, '')}/${storeSlug}/order/${token}`
/** Page de vente (formulaire de commande) du produit : là où revient un client qui abandonne le paiement. */
const checkoutPageUrl = (storeSlug: string, productId: string) => `${env.STOREFRONT_URL.replace(/\/$/, '')}/${storeSlug}/p/${productId}#commander`

/**
 * Crée (ou réutilise) la session de paiement d'une commande. Le montant vient de la commande en base.
 * Une session ouverte au bon montant est réutilisée ; si le total a changé (upsell ajouté), l'ancienne
 * session est expirée et une nouvelle est créée (nouvelle clé d'idempotence).
 */
export async function createPoSession(token: string): Promise<{ paid: true } | { paid: false; sessionId: string; url: string; mode: PoSettings['widgetMode']; locale: string | null }> {
  const { order, store } = await loadOrderByToken(token)
  if (order.paymentStatus === 'paid') return { paid: true }
  if (order.paymentStatus !== 'pending') throw conflict('Cette commande ne peut plus être payée', 'not_payable')
  if (order.paymentMethod === 'cod') throw badRequest('Cette commande se paie à la livraison', 'cod_order')
  if (order.paymentMethod === 'external') throw badRequest('Cette commande se paie sur une plateforme externe', 'external_order')
  const acc = await poAccount(store.id)
  if (!acc) throw badRequest('Le paiement en ligne n’est pas activé pour cette boutique', 'payments_disabled')
  const out = (s: PoSession) => ({ paid: false as const, sessionId: s.id, url: s.url, mode: acc.settings.widgetMode, locale: acc.settings.locale ?? store.locale ?? null })

  if (order.poSessionId) {
    try {
      const s = await po<PoSession>(acc.secretKey, `/checkout/sessions/${order.poSessionId}`)
      if (s.payment_status === 'paid') {
        await confirmFromSession(order, s)
        return { paid: true }
      }
      if (s.status === 'open' && sameAmount(s.amount, order.total) && s.currency === order.currency) return out(s)
      if (s.status === 'open') await expireSession(acc, order.poSessionId)
    } catch (e) {
      // Session introuvable (autre mode test/live, supprimée) : on en crée une nouvelle.
      if (!(e instanceof PoError) || e.status !== 404) throw toHttp(e)
    }
  }

  const items = await db.select({ name: orderItems.name, quantity: orderItems.quantity, productId: orderItems.productId, role: orderItems.role }).from(orderItems).where(eq(orderItems.orderId, order.id))
  const mainProduct = items.find((i) => i.role === 'main' && i.productId)?.productId ?? items.find((i) => i.productId)?.productId ?? null
  const seq = order.poSessionSeq + 1
  const s = acc.settings
  const allowed = s.allowedCountries
  const defaultCountry = s.defaultCountry ?? (allowed.length === 0 || allowed.includes(store.country) ? store.country : null)
  let session: PoSession
  try {
    session = await po<PoSession>(acc.secretKey, '/checkout/sessions', {
      method: 'POST',
      idempotencyKey: seq === 1 ? `order_${order.id}` : `order_${order.id}_${seq}`,
      body: {
        amount: Number(order.total),
        currency: order.currency,
        title: `${store.name} · Commande ${order.orderNumber}`.slice(0, 255),
        description: items.map((i) => `${i.quantity} x ${i.name}`).join(', ').slice(0, 2000) || undefined,
        client_reference: order.id,
        metadata: { order_id: order.id, order_number: order.orderNumber, store_id: store.id },
        customer: {
          name: order.customerName ?? undefined,
          email: order.customerEmail ?? undefined,
          phone: order.customerPhone ? order.customerPhone.replace(/\D/g, '').slice(0, 20) : undefined,
        },
        success_url: `${orderPageUrl(store.slug, order.accessToken)}?session={SESSION_ID}`,
        // Paiement abandonné : retour sur la page de vente du produit, pas sur la commande en attente.
        cancel_url: mainProduct ? checkoutPageUrl(store.slug, mainProduct) : orderPageUrl(store.slug, order.accessToken),
        ...(s.locale ? { locale: s.locale } : {}),
        ...(allowed.length ? { allowed_countries: allowed } : {}),
        ...(s.allowedOperators.length ? { allowed_operators: s.allowedOperators } : {}),
        ...(defaultCountry ? { default_country: defaultCountry } : {}),
      },
    })
  } catch (e) {
    throw toHttp(e)
  }
  await db
    .update(orders)
    .set({ poSessionId: session.id, poLivemode: session.livemode, poStatus: 'unpaid', poSessionSeq: seq, poFailure: null, paymentProvider: 'orchestrator', paymentRef: session.id, walletCollected: acc.source === 'wallet' })
    .where(eq(orders.id, order.id))
  await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_started', message: `Session de paiement créée${session.livemode ? '' : ' (test)'}`, data: { sessionId: session.id, seq } })
  return out(session)
}

function toHttp(e: unknown): Error {
  if (e instanceof PoError) {
    console.warn('[po]', e.status, e.code, e.message)
    if (e.code === 'invalid_api_key') return new HttpError(424, 'Paiement indisponible : la clé du compte de paiement de la boutique est invalide.', 'po_invalid_key')
    return new HttpError(424, 'Le paiement n’a pas pu être préparé. Réessayez dans un instant.', 'po_error')
  }
  return e as Error
}

async function expireSession(acc: PoAccount, sessionId: string) {
  try {
    await po(acc.secretKey, `/checkout/sessions/${sessionId}/expire`, { method: 'POST' })
  } catch (e) {
    // 409 session_complete : déjà payée (le webhook ou la réconciliation la confirmera) ; 409 payment_in_progress : on laisse faire.
    if (!(e instanceof PoError) || e.status !== 409) throw e
  }
}

/** Commande annulée ou panier modifié avant paiement : la session ne doit plus être payable. */
export async function expireOrderSession(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order?.poSessionId || order.paymentStatus === 'paid') return
  const acc = await poAccount(order.storeId)
  if (!acc) return
  await expireSession(acc, order.poSessionId)
  await db.update(orders).set({ poStatus: 'expired' }).where(eq(orders.id, orderId))
}

/** Détails utiles affichés au vendeur (prestataire, opérateur, raison d'échec). */
const txFields = (tx: PoTransaction | null) =>
  tx
    ? {
        poProvider: tx.provider?.slice(0, 30) ?? null,
        poOperator: tx.operator?.slice(0, 30) ?? null,
        poCountry: tx.country?.slice(0, 2) ?? null,
        poFailure: tx.status === 'failed' ? `${tx.failure_code ?? 'unknown'}${tx.failure_message ? ` : ${tx.failure_message}` : ''}`.slice(0, 300) : null,
      }
    : {}

/** Paiement confirmé par une source serveur : montant et devise vérifiés, puis commande payée (une seule fois). */
async function confirmPaid(order: Order, tx: { id: string; amount: number; currency: string; livemode: boolean }, details: PoTransaction | null, source: string): Promise<boolean> {
  if (!sameAmount(tx.amount, order.total) || tx.currency !== order.currency) {
    await db.update(orders).set({ poStatus: 'mismatch', poTransactionId: tx.id, ...txFields(details) }).where(eq(orders.id, order.id))
    await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_amount_mismatch', message: `Montant payé (${tx.amount} ${tx.currency}) différent du total (${order.total} ${order.currency})`, data: { transactionId: tx.id, source } })
    return false
  }
  await db.update(orders).set({ poStatus: 'paid', poTransactionId: tx.id, poLivemode: tx.livemode, poFailure: null, ...txFields(details) }).where(eq(orders.id, order.id))
  return markOrderPaid(order.id, { provider: 'orchestrator', ref: tx.id, note: `Paiement confirmé${details?.operator ? ` (${details.operator.toUpperCase()}${details.provider ? ` via ${details.provider}` : ''})` : ''}${tx.livemode ? '' : ' [test]'}` })
}

async function confirmFromSession(order: Order, s: PoSession) {
  if (s.payment_status === 'paid' && s.transaction) return confirmPaid(order, { id: s.transaction.id, amount: s.amount, currency: s.currency, livemode: s.livemode }, s.transaction, 'session')
  return false
}

/**
 * Vérification serveur d'une commande (page commande, réconciliation) : GET /checkout/sessions/{id}.
 * C'est, avec le webhook signé, la seule voie qui peut marquer la commande payée.
 */
export async function refreshPoOrder(order: Order): Promise<'paid' | 'pending' | 'failed'> {
  if (order.paymentStatus === 'paid') return 'paid'
  if (!order.poSessionId) return 'pending'
  const acc = await poAccount(order.storeId)
  if (!acc) return 'pending'
  let s: PoSession
  try {
    s = await po<PoSession>(acc.secretKey, `/checkout/sessions/${order.poSessionId}`)
  } catch {
    return 'pending'
  }
  await db.update(orders).set({ poCheckedAt: new Date() }).where(eq(orders.id, order.id))
  if (s.payment_status === 'paid') return (await confirmFromSession(order, s)) ? 'paid' : 'pending'
  if (s.transaction?.status === 'failed') {
    await db.update(orders).set({ poStatus: 'failed', ...txFields(s.transaction) }).where(eq(orders.id, order.id))
    return 'failed'
  }
  if (s.status === 'expired') await db.update(orders).set({ poStatus: 'expired' }).where(eq(orders.id, order.id))
  return 'pending'
}

/** Signature X-PO-Signature : t=<unix>,v1=hex(HMAC_SHA256(secret, "<t>.<corps brut>")), 300 s maximum. */
export function verifyPoSignature(rawBody: string, header: string | undefined, secret: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((p) => {
    const i = p.indexOf('=')
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()]
  }))
  const t = Number(parts.t)
  if (!parts.v1 || !Number.isFinite(t) || Math.abs(nowSec - t) > 300) return false
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex')
  const a = Buffer.from(parts.v1, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

interface PoEvent {
  id: string
  type: string
  livemode: boolean
  data?: { object?: PoTransaction }
}

/**
 * Webhook Payment Orchestrator. Le secret de vérification est celui du compte : jeton d'URL de la boutique,
 * sinon compte de la boutique de la commande, sinon compte plateforme. Rien n'est fait avant la vérification.
 * Retour : code HTTP à renvoyer (400 signature invalide ; 500 = Payment Orchestrator réessaiera).
 */
export async function handlePoWebhook(rawBody: string, signature: string | undefined, webhookToken?: string): Promise<number> {
  let event: PoEvent
  try {
    event = JSON.parse(rawBody) as PoEvent
  } catch {
    return 400
  }
  const tx = event.data?.object ?? null

  // Abonnement Zuri (référence « bill_<id> ») : compte de la plateforme ; la session est relue côté serveur.
  const billingId = tx?.client_reference?.match(/^bill_(\d{1,12})$/)?.[1]
  if (billingId && !webhookToken) {
    const secretP = (await platformPo())?.webhookSecret
    if (!secretP || !verifyPoSignature(rawBody, signature, secretP)) return 400
    const [freshB] = await db.insert(poWebhookEvents).values({ eventId: String(event.id).slice(0, 80), type: event.type?.slice(0, 40) }).onConflictDoNothing().returning({ id: poWebhookEvents.eventId })
    if (!freshB) return 200
    try {
      if (event.type === 'payment.succeeded') await (await import('./billing')).refreshBillingPayment(Number(billingId))
      return 200
    } catch (e) {
      console.error('[po webhook billing]', e)
      await db.delete(poWebhookEvents).where(eq(poWebhookEvents.eventId, String(event.id).slice(0, 80)))
      return 500
    }
  }

  // 1. Trouver le compte (et donc le secret) sans encore croire le contenu.
  let storeId: string | null = null
  let secret: string | null = null
  if (webhookToken) {
    const [row] = await db.select().from(paymentAccounts).where(and(eq(paymentAccounts.provider, 'orchestrator'), eq(paymentAccounts.webhookToken, webhookToken))).limit(1)
    if (!row) return 400
    storeId = row.storeId
    secret = decryptJson<Creds>(row.credentialsEnc, {})[row.mode]?.webhookSecret ?? null
  }
  const order = tx ? await findOrder(tx, storeId) : null
  if (!secret && order) secret = (await poAccount(order.storeId))?.webhookSecret ?? null
  secret ??= (await platformPo())?.webhookSecret ?? null
  if (!secret || !verifyPoSignature(rawBody, signature, secret)) return 400

  // 2. Idempotence : un événement n'est traité qu'une fois.
  const [fresh] = await db.insert(poWebhookEvents).values({ eventId: String(event.id).slice(0, 80), type: event.type?.slice(0, 40) }).onConflictDoNothing().returning({ id: poWebhookEvents.eventId })
  if (!fresh) return 200
  try {
    await processEvent(event, order)
    return 200
  } catch (e) {
    console.error('[po webhook]', event.type, e)
    // On libère l'événement pour que la nouvelle tentative de Payment Orchestrator le traite.
    await db.delete(poWebhookEvents).where(eq(poWebhookEvents.eventId, String(event.id).slice(0, 80)))
    return 500
  }
}

async function findOrder(tx: PoTransaction, storeId: string | null): Promise<Order | null> {
  const byRef = tx.client_reference && /^ord_[0-9A-Za-z]{8,32}$/.test(tx.client_reference) ? eq(orders.id, tx.client_reference) : undefined
  const bySession = tx.checkout_session ? eq(orders.poSessionId, tx.checkout_session) : undefined
  const match = byRef && bySession ? or(byRef, bySession) : (byRef ?? bySession)
  if (!match) return null
  const [o] = await db.select().from(orders).where(and(match, storeId ? eq(orders.storeId, storeId) : undefined)).limit(1)
  return o ?? null
}

async function processEvent(event: PoEvent, order: Order | null) {
  const tx = event.data?.object
  if (event.type === 'webhook.ping' || !tx) return
  if (!order) {
    console.warn('[po webhook] commande introuvable', event.type, tx.client_reference, tx.checkout_session)
    return
  }
  if (event.type === 'payment.succeeded') {
    if (order.paymentStatus === 'paid') {
      await db.update(orders).set({ poTransactionId: order.poTransactionId ?? tx.id, ...txFields(tx) }).where(eq(orders.id, order.id))
      return
    }
    await confirmPaid(order, { id: tx.id, amount: tx.amount, currency: tx.currency, livemode: tx.livemode }, tx, 'webhook')
    return
  }
  if (event.type === 'payment.failed') {
    // La session reste ouverte : le client peut réessayer. La commande reste en attente.
    if (order.paymentStatus === 'paid') return
    await db.update(orders).set({ poStatus: 'failed', ...txFields(tx) }).where(eq(orders.id, order.id))
    await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_failed', message: `Paiement refusé : ${tx.failure_code ?? 'inconnu'}${tx.operator ? ` (${tx.operator.toUpperCase()})` : ''}`, data: { transactionId: tx.id, failureCode: tx.failure_code } })
    return
  }
  if (event.type === 'payment.refunded') {
    await db.update(orders).set({ poStatus: 'refunded', paymentStatus: 'refunded' }).where(eq(orders.id, order.id))
    await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_refunded', message: 'Paiement remboursé', data: { transactionId: tx.id } })
  }
}

/** Réconciliation : commandes en attente avec une session de moins de 24 h, vérifiées au plus toutes les 15 min. */
export async function reconcilePoOrders() {
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, 'pending'),
        isNotNull(orders.poSessionId),
        gte(orders.createdAt, new Date(Date.now() - 24 * 3600_000)),
        lt(orders.createdAt, new Date(Date.now() - 2 * 60_000)),
        or(isNull(orders.poCheckedAt), lt(orders.poCheckedAt, new Date(Date.now() - 15 * 60_000))),
        dsql`coalesce(${orders.poStatus}, '') not in ('expired', 'mismatch')`,
      ),
    )
    .limit(200)
  let paid = 0
  for (const o of rows) if ((await refreshPoOrder(o)) === 'paid') paid++
  const billing = await (await import('./billing')).reconcilePoBilling()
  return { checked: rows.length + billing.checked, paid: paid + billing.paid }
}
