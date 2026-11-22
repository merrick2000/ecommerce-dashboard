import { NATIVE_PROVIDERS, type PaymentProvider } from '@zuri/shared'
import { resolveFeatures, storeOwner } from '../services/platform'
import { refreshBillingByRef } from '../services/billing'
import { and, desc, eq, gte, inArray, lte, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { orderEvents, orderItems, orders, paymentAccounts, paymentTransactions, products, stores, type Order } from '../db/schema'
import { decryptJson } from '../lib/crypto'
import { env } from '../lib/env'
import { badRequest, conflict, HttpError, notFound } from '../lib/errors'
import { markOrderPaid } from '../services/orders'
import { reconcilePoOrders, refreshPoOrder } from '../services/po'
import { Chariow } from './providers/chariow'
import { FedaPay } from './providers/fedapay'
import { FeexPay } from './providers/feexpay'
import { Maketou } from './providers/maketou'
import { PawaPay } from './providers/pawapay'
import { PayDunya } from './providers/paydunya'
import { ROUTING } from './routing'
import type { InitiateResult, PaymentProviderClient, PaymentRequest, ProviderMode } from './types'

type Creds = Partial<Record<ProviderMode, Record<string, string>>>
const MAX_ATTEMPTS_PER_HOUR = 5
/** Tolérance d'arrondi (les providers arrondissent à l'unité supérieure). */
const AMOUNT_TOLERANCE = 1

/** Fabrique de clients, remplaçable en test. */
export let makeClient = (provider: PaymentProvider, mode: ProviderMode, c: Record<string, string>): PaymentProviderClient | null => {
  switch (provider) {
    case 'feexpay':
      return c.apiKey && c.shopId ? new FeexPay({ apiKey: c.apiKey, shopId: c.shopId }) : null
    case 'fedapay':
      return c.apiKey ? new FedaPay({ apiKey: c.apiKey }, mode) : null
    case 'paydunya':
      return c.masterKey && c.publicKey && c.privateKey && c.token ? new PayDunya({ masterKey: c.masterKey, publicKey: c.publicKey, privateKey: c.privateKey, token: c.token }, mode) : null
    case 'pawapay':
      return c.apiKey ? new PawaPay({ apiKey: c.apiKey }, mode) : null
    // Plateformes hébergées : pas de sandbox, toujours les clés live.
    case 'chariow':
      return c.apiKey ? new Chariow({ apiKey: c.apiKey }) : null
    case 'maketou':
      return c.apiKey ? new Maketou({ apiKey: c.apiKey }) : null
    // Payment Orchestrator : pas de paiement réseau par réseau, une session de paiement (voir services/po.ts).
    case 'orchestrator':
      return null
  }
}
export function setClientFactory(f: typeof makeClient) {
  makeClient = f
}

interface LoadedAccount {
  provider: PaymentProvider
  webhookToken: string
  client: PaymentProviderClient
}

export async function loadAccounts(storeId: string, onlyEnabled = true): Promise<LoadedAccount[]> {
  const rows = await db
    .select()
    .from(paymentAccounts)
    .where(onlyEnabled ? and(eq(paymentAccounts.storeId, storeId), eq(paymentAccounts.enabled, true)) : eq(paymentAccounts.storeId, storeId))
  return rows.flatMap((row) => {
    const creds = decryptJson<Creds>(row.credentialsEnc, {})
    const hosted = row.provider === 'chariow' || row.provider === 'maketou'
    const mode: ProviderMode = hosted ? 'live' : row.mode
    const client = makeClient(row.provider, mode, creds[mode] ?? {})
    return client ? [{ provider: row.provider, webhookToken: row.webhookToken, client }] : []
  })
}

export const webhookUrl = (provider: string, token: string) => `${env.APP_URL.replace(/\/$/, '')}/api/v1/webhooks/${provider}/${token}`

/** Pays et réseaux réellement payables pour cette boutique (selon les moyens activés). */
export async function availableNetworks(storeId: string) {
  const owner = await storeOwner(storeId)
  if (!owner || !(await resolveFeatures(owner)).onlinePayments) return []
  const enabled = new Set((await loadAccounts(storeId)).map((a) => a.provider as string))
  const out: { country: string; networks: string[] }[] = []
  for (const [country, networks] of Object.entries(ROUTING)) {
    const ok = Object.entries(networks)
      .filter(([, providers]) => providers.some((p) => enabled.has(p)))
      .map(([n]) => n)
    if (ok.length) out.push({ country, networks: ok })
  }
  return out
}

async function loadPayableOrder(token: string) {
  const [row] = await db.select({ order: orders, store: stores }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(eq(orders.accessToken, token)).limit(1)
  if (!row) throw notFound('Commande')
  const [item] = await db.select({ product: products }).from(orderItems).innerJoin(products, eq(products.id, orderItems.productId)).where(eq(orderItems.orderId, row.order.id)).limit(1)
  return { ...row, product: item?.product ?? null }
}

function buildRequest(order: Order, storeSlug: string, input: { country: string; network: string; phone: string }, account: LoadedAccount, product: Awaited<ReturnType<typeof loadPayableOrder>>['product']): PaymentRequest {
  const integration = product?.payment.method === 'integration' ? product.payment.integration : null
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: order.currency,
    phone: input.phone,
    country: input.country,
    network: input.network,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    returnUrl: `${env.STOREFRONT_URL.replace(/\/$/, '')}/${storeSlug}/order/${order.accessToken}`,
    webhookUrl: webhookUrl(account.provider, account.webhookToken),
    chariowProductId: integration?.platform === 'chariow' ? integration.productId : null,
    maketouProductId: integration?.platform === 'maketou' ? integration.productId : null,
  }
}

export type PublicPaymentResponse =
  | { status: 'processing'; message: string }
  | { status: 'redirect'; redirectUrl: string }
  | { status: 'otp_required'; ussdInstruction?: string }
  | { status: 'paid' }

/**
 * Lance le paiement d'une commande. Essaie les providers dans l'ordre de routage
 * (repli automatique) et limite le nombre de tentatives, l'ancien code permettait
 * de spammer des demandes USSD vers n'importe quel numéro.
 */
export async function initiatePayment(token: string, input: { country: string; network: string; phone: string }): Promise<PublicPaymentResponse> {
  const { order, store, product } = await loadPayableOrder(token)
  if (order.paymentStatus === 'paid') return { status: 'paid' }
  if (order.paymentStatus !== 'pending') throw conflict('Cette commande ne peut plus être payée', 'not_payable')
  if (order.paymentMethod === 'cod') throw badRequest('Cette commande se paie à la livraison', 'cod_order')

  const [{ attempts } = { attempts: 0 }] = await db
    .select({ attempts: dsql<number>`count(*)::int` })
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.orderId, order.id), gte(paymentTransactions.createdAt, new Date(Date.now() - 3600_000))))
  if (attempts >= MAX_ATTEMPTS_PER_HOUR) throw new HttpError(429, 'Trop de tentatives de paiement. Réessayez dans une heure.', 'too_many_attempts')

  const accounts = await loadAccounts(store.id)
  let candidates: LoadedAccount[]
  if (order.paymentMethod === 'external') {
    const integration = product?.payment.method === 'integration' ? product.payment.integration : null
    if (!integration) throw badRequest('Aucune plateforme configurée pour ce produit')
    // Selar / lien : simple redirection, la vente est confirmée par la plateforme.
    if (integration.platform === 'selar' || integration.platform === 'link') return { status: 'redirect', redirectUrl: integration.url! }
    candidates = accounts.filter((a) => a.provider === integration.platform)
    if (!candidates.length) throw badRequest(`La plateforme ${integration.platform} n’est pas connectée`, 'integration_disabled')
  } else {
    const route = ROUTING[input.country]?.[input.network] ?? []
    candidates = route.flatMap((p) => accounts.filter((a) => a.provider === p && (NATIVE_PROVIDERS as readonly string[]).includes(p)))
    if (!candidates.length) throw badRequest('Ce réseau n’est pas disponible', 'network_unavailable')
  }

  const errors: string[] = []
  for (const account of candidates) {
    const req = buildRequest(order, store.slug, input, account, product)
    let result: InitiateResult
    try {
      result = await account.client.initiate(req)
    } catch (e) {
      result = { status: 'failed', error: e instanceof Error ? e.message : 'Erreur réseau' }
    }
    await db.insert(paymentTransactions).values({
      orderId: order.id,
      provider: account.provider,
      providerRef: result.status === 'failed' ? null : result.ref,
      country: input.country,
      network: input.network,
      phone: input.phone,
      status: result.status,
      amount: order.total,
      currency: order.currency,
      providerResponse: result.status === 'otp_required' ? { otp: result.otp } : null,
      errorMessage: result.status === 'failed' ? result.error.slice(0, 500) : null,
    })
    if (result.status === 'failed') {
      errors.push(`${account.provider}: ${result.error}`)
      continue
    }
    await db.update(orders).set({ paymentProvider: account.provider, paymentRef: result.ref }).where(eq(orders.id, order.id))
    await db.insert(orderEvents).values({ orderId: order.id, type: 'payment_started', message: `Paiement lancé via ${account.provider}`, data: { network: input.network, country: input.country } })
    if (result.status === 'redirect') return { status: 'redirect', redirectUrl: result.redirectUrl }
    if (result.status === 'otp_required') return { status: 'otp_required', ussdInstruction: result.otp.ussdInstruction }
    return { status: 'processing', message: 'Validez le paiement sur votre téléphone' }
  }
  console.warn(`[payments] échec commande ${order.orderNumber}:`, errors)
  throw new HttpError(502, 'Le paiement n’a pas pu être lancé. Réessayez ou choisissez un autre réseau.', 'payment_failed')
}

export async function confirmOtp(token: string, otp: string): Promise<PublicPaymentResponse> {
  const { order, store, product } = await loadPayableOrder(token)
  if (order.paymentStatus === 'paid') return { status: 'paid' }
  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.orderId, order.id), eq(paymentTransactions.status, 'otp_required')))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(1)
  if (!tx) throw badRequest('Aucun paiement en attente de code', 'no_otp_pending')
  const account = (await loadAccounts(store.id)).find((a) => a.provider === tx.provider)
  if (!account?.client.confirmOtp) throw badRequest('Ce moyen de paiement ne gère pas les codes')
  const req = buildRequest(order, store.slug, { country: tx.country ?? '', network: tx.network ?? '', phone: tx.phone ?? '' }, account, product)
  const otpData = ((tx.providerResponse as { otp?: Record<string, unknown> } | null)?.otp ?? {}) as Record<string, unknown>
  const result = await account.client.confirmOtp(req, tx.providerRef ?? '', otp, otpData)
  if (result.status === 'failed') {
    await db.update(paymentTransactions).set({ errorMessage: result.error.slice(0, 500) }).where(eq(paymentTransactions.id, tx.id))
    throw badRequest(result.error || 'Code invalide', 'otp_invalid')
  }
  const ref = result.ref
  await db.update(paymentTransactions).set({ status: result.status === 'redirect' ? 'redirect' : 'processing', providerRef: ref }).where(eq(paymentTransactions.id, tx.id))
  if (ref !== order.paymentRef) await db.update(orders).set({ paymentRef: ref }).where(eq(orders.id, order.id))
  const state = await refreshOrderPayment(order.id)
  if (state === 'paid') return { status: 'paid' }
  if (result.status === 'redirect') return { status: 'redirect', redirectUrl: result.redirectUrl }
  return { status: 'processing', message: 'Paiement en cours de validation' }
}

/**
 * Interroge le provider pour les transactions en cours de la commande.
 * C'est la SEULE voie qui peut marquer une commande payée côté provider
 * (webhook, polling et réconciliation passent tous par ici).
 */
export async function refreshOrderPayment(orderId: string): Promise<'paid' | 'pending' | 'failed'> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return 'failed'
  if (order.paymentStatus === 'paid') return 'paid'
  // Payment Orchestrator : lecture serveur de la session (seule voie avec le webhook signé).
  if (order.poSessionId) return refreshPoOrder(order)
  const txs = await db
    .select()
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.orderId, orderId), inArray(paymentTransactions.status, ['processing', 'redirect', 'otp_required'])))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(5)
  if (!txs.length) return 'pending'
  const accounts = await loadAccounts(order.storeId, false)
  let anyPending = false
  for (const tx of txs) {
    if (!tx.providerRef || tx.providerRef.startsWith('pending:')) {
      anyPending = true
      continue
    }
    const account = accounts.find((a) => a.provider === tx.provider)
    if (!account) continue
    let res
    try {
      res = await account.client.checkStatus(tx.providerRef)
    } catch {
      anyPending = true
      continue
    }
    if (res.status === 'paid') {
      if (res.amount !== undefined && res.amount + AMOUNT_TOLERANCE < order.total) {
        // Montant payé inférieur à la commande : on ne livre pas, on signale.
        await db.update(paymentTransactions).set({ status: 'failed', errorMessage: `Montant reçu ${res.amount} < ${order.total}` }).where(eq(paymentTransactions.id, tx.id))
        await db.insert(orderEvents).values({ orderId, type: 'payment_amount_mismatch', message: `Montant reçu (${res.amount}) inférieur au total (${order.total})`, data: { provider: tx.provider, ref: tx.providerRef } })
        continue
      }
      await db.update(paymentTransactions).set({ status: 'paid' }).where(eq(paymentTransactions.id, tx.id))
      await markOrderPaid(orderId, { provider: tx.provider, ref: tx.providerRef })
      return 'paid'
    }
    if (res.status === 'failed') await db.update(paymentTransactions).set({ status: 'failed', errorMessage: 'Refusé par le provider' }).where(eq(paymentTransactions.id, tx.id))
    else anyPending = true
  }
  return anyPending ? 'pending' : 'failed'
}

/** Statut pour le polling du storefront, limité côté route pour ne pas marteler les providers. */
export async function paymentStatus(token: string) {
  const [order] = await db.select({ id: orders.id, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.accessToken, token)).limit(1)
  if (!order) throw notFound('Commande')
  if (order.paymentStatus === 'paid') return { status: 'paid' as const }
  return { status: await refreshOrderPayment(order.id) }
}

/**
 * Webhook : on identifie le compte par son jeton d'URL, on extrait la référence,
 * puis on REVÉRIFIE auprès du provider. Le contenu du webhook n'est jamais cru :
 * un webhook forgé ne peut au pire que déclencher une vérification.
 */
export async function handleWebhook(provider: PaymentProvider, webhookToken: string, payload: unknown): Promise<void> {
  const [account] = await db
    .select({ storeId: paymentAccounts.storeId })
    .from(paymentAccounts)
    .where(and(eq(paymentAccounts.provider, provider), eq(paymentAccounts.webhookToken, webhookToken)))
    .limit(1)
  if (!account) return
  const client = (await loadAccounts(account.storeId, false)).find((a) => a.provider === provider)?.client
  const ref = client?.webhookRef(payload)
  if (!ref) return
  const [tx] = await db
    .select({ id: paymentTransactions.id, orderId: paymentTransactions.orderId })
    .from(paymentTransactions)
    .innerJoin(orders, eq(orders.id, paymentTransactions.orderId))
    .where(and(eq(paymentTransactions.provider, provider), eq(paymentTransactions.providerRef, ref), eq(orders.storeId, account.storeId)))
    .limit(1)
  if (!tx) {
    // Paiement d'abonnement (encaissé sur le compte de la plateforme) ?
    await refreshBillingByRef(provider, ref)
    return
  }
  await db.update(paymentTransactions).set({ webhookPayload: payload as object }).where(eq(paymentTransactions.id, tx.id))
  await refreshOrderPayment(tx.orderId)
}

/** Réconciliation périodique : rattrape les paiements dont le client a fermé la page (Maketou n'a pas de webhook). */
export async function reconcilePendingPayments() {
  const rows = await db
    .selectDistinct({ orderId: paymentTransactions.orderId })
    .from(paymentTransactions)
    .innerJoin(orders, eq(orders.id, paymentTransactions.orderId))
    .where(
      and(
        inArray(paymentTransactions.status, ['processing', 'redirect']),
        eq(orders.paymentStatus, 'pending'),
        gte(paymentTransactions.createdAt, new Date(Date.now() - 48 * 3600_000)),
        lte(paymentTransactions.createdAt, new Date(Date.now() - 2 * 60_000)),
      ),
    )
    .limit(200)
  let paid = 0
  for (const { orderId } of rows) if ((await refreshOrderPayment(orderId)) === 'paid') paid++
  const po = await reconcilePoOrders()
  return { checked: rows.length + po.checked, paid: paid + po.paid }
}
