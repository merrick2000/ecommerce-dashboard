/**
 * Abonnements : paiement Mobile Money sur les comptes de la boutique choisie par le super admin
 * (FedaPay, FeexPay, pawaPay), vérification auprès du prestataire, prolongation de la formule.
 */
import { BILLING_MONTHS, PLANS, priceFor, type PlanId } from '@zuri/shared'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { billingPayments, paymentAccounts, subscriptions, type User } from '../db/schema'
import { env } from '../lib/env'
import { badRequest, HttpError } from '../lib/errors'
import { loadAccounts, webhookUrl } from '../payments/service'
import { ROUTING } from '../payments/routing'
import type { PaymentProvider } from '@zuri/shared'
import { getSetting } from './platform'

const BILLING_PROVIDERS: PaymentProvider[] = ['fedapay', 'feexpay', 'pawapay']

async function billingStoreId() {
  const cfg = await getSetting<{ storeId?: string } | null>('billing.account', null)
  return cfg?.storeId ?? null
}

/** Pays et réseaux disponibles pour payer un abonnement. */
export async function billingNetworks() {
  const storeId = await billingStoreId()
  if (!storeId) return []
  const enabled = new Set((await loadAccounts(storeId)).map((a) => a.provider).filter((p) => BILLING_PROVIDERS.includes(p)))
  return Object.entries(ROUTING)
    .map(([country, networks]) => ({ country, networks: Object.entries(networks).filter(([, ps]) => ps.some((p) => enabled.has(p as PaymentProvider))).map(([n]) => n) }))
    .filter((x) => x.networks.length)
}

export async function startBillingPayment(user: User, input: { plan: Exclude<PlanId, 'free'>; months: 1 | 12; phone: string; country: string; network: string }) {
  if (!(BILLING_MONTHS as readonly number[]).includes(input.months)) throw badRequest('Durée invalide')
  const storeId = await billingStoreId()
  if (!storeId) throw new HttpError(503, 'Le paiement des abonnements n’est pas encore configuré.', 'billing_unconfigured')
  const route = (ROUTING[input.country]?.[input.network] ?? []) as PaymentProvider[]
  const accounts = (await loadAccounts(storeId)).filter((a) => BILLING_PROVIDERS.includes(a.provider) && route.includes(a.provider))
  if (!accounts.length) throw badRequest('Ce réseau n’est pas disponible pour le paiement de l’abonnement', 'network_unavailable')
  const amount = priceFor(input.plan, input.months)
  const errors: string[] = []
  for (const account of accounts) {
    const [bp] = await db.insert(billingPayments).values({ userId: user.id, plan: input.plan, months: input.months, amount, currency: 'XOF', provider: account.provider, phone: input.phone }).returning()
    const req = {
      orderId: `abo-${bp!.id}`,
      orderNumber: `ABO-${bp!.id}`,
      amount,
      currency: 'XOF',
      phone: input.phone,
      country: input.country,
      network: input.network,
      customerName: user.name,
      customerEmail: user.email,
      returnUrl: `${env.APP_URL.replace(/\/$/, '')}/billing?payment=${bp!.id}`,
      webhookUrl: webhookUrl(account.provider, account.webhookToken),
    }
    try {
      const r = await account.client.initiate(req)
      if (r.status === 'failed') throw new Error(r.error)
      await db.update(billingPayments).set({ providerRef: r.ref }).where(eq(billingPayments.id, bp!.id))
      if (r.status === 'redirect') return { id: bp!.id, status: 'redirect' as const, redirectUrl: r.redirectUrl }
      if (r.status === 'otp_required') return { id: bp!.id, status: 'processing' as const, message: r.otp.ussdInstruction ?? 'Suis les instructions reçues sur ton téléphone' }
      return { id: bp!.id, status: 'processing' as const, message: 'Valide le paiement sur ton téléphone' }
    } catch (e) {
      errors.push(`${account.provider}: ${e instanceof Error ? e.message : 'erreur'}`)
      await db.update(billingPayments).set({ status: 'failed' }).where(eq(billingPayments.id, bp!.id))
    }
  }
  console.warn('[billing] échec', errors)
  throw new HttpError(502, 'Le paiement n’a pas pu être lancé. Réessaie ou choisis un autre réseau.', 'payment_failed')
}

/** Vérifie un paiement auprès du prestataire ; s'il est payé (montant exact), prolonge la formule. */
export async function refreshBillingPayment(id: number, userId?: number) {
  const [bp] = await db.select().from(billingPayments).where(userId ? and(eq(billingPayments.id, id), eq(billingPayments.userId, userId)) : eq(billingPayments.id, id)).limit(1)
  if (!bp) throw new HttpError(404, 'Paiement introuvable', 'not_found')
  if (bp.status !== 'pending' || !bp.providerRef) return bp.status
  const storeId = await billingStoreId()
  const account = storeId ? (await loadAccounts(storeId, false)).find((a) => a.provider === bp.provider) : null
  if (!account) return 'pending'
  const st = await account.client.checkStatus(bp.providerRef)
  if (st.status === 'failed') {
    await db.update(billingPayments).set({ status: 'failed' }).where(eq(billingPayments.id, bp.id))
    return 'failed'
  }
  if (st.status !== 'paid') return 'pending'
  if (st.amount !== undefined && st.amount + 1 < bp.amount) {
    console.warn(`[billing] montant incohérent pour ${bp.id}: ${st.amount} < ${bp.amount}`)
    return 'pending'
  }
  // Une seule application, même si le webhook et le client vérifient en même temps.
  const [done] = await db.update(billingPayments).set({ status: 'paid', paidAt: new Date() }).where(and(eq(billingPayments.id, bp.id), eq(billingPayments.status, 'pending'))).returning()
  if (done) await extendSubscription(bp.userId, bp.plan, bp.months, 'paid')
  return 'paid'
}

export async function refreshBillingByRef(provider: PaymentProvider, ref: string) {
  const [bp] = await db.select({ id: billingPayments.id }).from(billingPayments).where(and(eq(billingPayments.provider, provider), eq(billingPayments.providerRef, ref))).limit(1)
  if (bp) await refreshBillingPayment(bp.id)
}

/** Prolonge (ou crée) l'abonnement : la nouvelle période commence à la fin de la période en cours si elle n'est pas finie. */
export async function extendSubscription(userId: number, plan: PlanId, months: number, source: 'paid' | 'offered', note?: string) {
  const [cur] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  const start = cur && cur.currentPeriodEnd > new Date() && cur.plan === plan ? cur.currentPeriodEnd : new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  await db
    .insert(subscriptions)
    .values({ userId, plan, currentPeriodEnd: end, source, note })
    .onConflictDoUpdate({ target: subscriptions.userId, set: { plan, currentPeriodEnd: end, source, note: note ?? null, updatedAt: new Date() } })
  return end
}

export async function billingHistory(userId: number) {
  return db.select().from(billingPayments).where(eq(billingPayments.userId, userId)).orderBy(desc(billingPayments.createdAt)).limit(50)
}

export const planCatalog = () => Object.values(PLANS)
export { paymentAccounts }
