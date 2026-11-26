/**
 * Abonnements : paiement Mobile Money via Payment Orchestrator (compte de la plateforme) quand il est
 * configuré, sinon sur les comptes de la boutique choisie par le super admin (FedaPay, FeexPay, pawaPay).
 * La formule n'est prolongée qu'après confirmation serveur (montant exact), une seule fois.
 */
import { BILLING_MONTHS, DEFAULT_PROMO, LAUNCH, PLANS, priceFor, promoActive, promoPrice, type BillingPromo, type PlanId } from '@zuri/shared'
import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '../db/client'
import { billingPayments, paymentAccounts, subscriptions, type User } from '../db/schema'
import { env } from '../lib/env'
import { badRequest, HttpError } from '../lib/errors'
import { loadAccounts, webhookUrl } from '../payments/service'
import { ROUTING } from '../payments/routing'
import type { PaymentProvider } from '@zuri/shared'
import { getSetting } from './platform'
import { platformPo, po, PoError } from './po'

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

/** Moyen de paiement des abonnements exposé au tableau de bord (aucun secret). */
export async function billingGateway() {
  const acc = await platformPo()
  return acc ? { kind: 'orchestrator' as const, widgetMode: 'auto' as const, locale: 'fr' as const, widgetUrl: `${env.PO_BASE_URL.replace(/\/$/, '')}/widget.js`, test: !acc.livemode } : { kind: 'direct' as const }
}

type PoSessionLite = { id: string; url: string; status: string; payment_status: string; amount: number; currency: string; livemode: boolean; transaction: { id: string; status: string } | null }

/** Abonnement payé via Payment Orchestrator : une session par paiement, référence « bill_<id> ». */
async function startPoBilling(user: User, input: { plan: Exclude<PlanId, 'free'>; months: 1 | 12 }) {
  const acc = (await platformPo())!
  const amount = promoPrice(priceFor(input.plan, input.months), await billingPromo())
  const [bp] = await db.insert(billingPayments).values({ userId: user.id, plan: input.plan, months: input.months, amount, currency: 'XOF', provider: 'orchestrator' }).returning()
  const app = env.APP_URL.replace(/\/$/, '')
  try {
    const s = await po<PoSessionLite>(acc.secretKey, '/checkout/sessions', {
      method: 'POST',
      idempotencyKey: `billing_${bp!.id}`,
      body: {
        amount,
        currency: 'XOF',
        title: `Zuri ${PLANS[input.plan].name} · ${input.months === 12 ? '12 mois' : '1 mois'}`,
        client_reference: `bill_${bp!.id}`,
        metadata: { kind: 'billing', billing_payment_id: String(bp!.id), user_id: String(user.id), plan: input.plan, months: String(input.months) },
        customer: { name: user.name, email: user.email },
        success_url: `${app}/billing?payment=${bp!.id}`,
        cancel_url: `${app}/billing`,
        locale: 'fr',
      },
    })
    await db.update(billingPayments).set({ providerRef: s.id }).where(eq(billingPayments.id, bp!.id))
    return { id: bp!.id, status: 'po' as const, sessionId: s.id, url: s.url, mode: 'auto' as const, locale: 'fr' as const }
  } catch (e) {
    const reason = e instanceof PoError ? `Payment Orchestrator ${e.status} ${e.code} : ${e.message}` : e instanceof Error ? e.message : 'Erreur inconnue'
    await db.update(billingPayments).set({ status: 'failed', error: reason.slice(0, 300) }).where(eq(billingPayments.id, bp!.id))
    console.warn('[billing po]', e instanceof PoError ? `${e.status} ${e.code} ${e.message}` : e)
    throw new HttpError(424, `Le paiement n’a pas pu être préparé. Réessaie dans un instant.${user.isPlatformAdmin ? ` (Détail pour le super admin : ${reason})` : ''}`, 'payment_failed')
  }
}

export async function startBillingPayment(user: User, input: { plan: Exclude<PlanId, 'free'>; months: 1 | 12; phone?: string; country?: string; network?: string }) {
  if (!(BILLING_MONTHS as readonly number[]).includes(input.months)) throw badRequest('Durée invalide')
  if (await platformPo()) return startPoBilling(user, input)
  if (!input.phone || !input.country || !input.network) throw badRequest('Numéro, pays et réseau requis')
  const phone = input.phone
  const country = input.country
  const network = input.network
  const storeId = await billingStoreId()
  if (!storeId) throw new HttpError(503, 'Le paiement des abonnements n’est pas encore configuré.', 'billing_unconfigured')
  const route = (ROUTING[country]?.[network] ?? []) as PaymentProvider[]
  const accounts = (await loadAccounts(storeId)).filter((a) => BILLING_PROVIDERS.includes(a.provider) && route.includes(a.provider))
  if (!accounts.length) throw badRequest('Ce réseau n’est pas disponible pour le paiement de l’abonnement', 'network_unavailable')
  const amount = promoPrice(priceFor(input.plan, input.months), await billingPromo())
  const errors: string[] = []
  for (const account of accounts) {
    const [bp] = await db.insert(billingPayments).values({ userId: user.id, plan: input.plan, months: input.months, amount, currency: 'XOF', provider: account.provider, phone }).returning()
    const req = {
      orderId: `abo-${bp!.id}`,
      orderNumber: `ABO-${bp!.id}`,
      amount,
      currency: 'XOF',
      phone,
      country,
      network,
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
      await db.update(billingPayments).set({ status: 'failed', error: errors.at(-1)!.slice(0, 300) }).where(eq(billingPayments.id, bp!.id))
    }
  }
  console.warn('[billing] échec', errors)
  throw new HttpError(424, 'Le paiement n’a pas pu être lancé. Réessaie ou choisis un autre réseau.', 'payment_failed')
}

/** Vérifie un paiement auprès du prestataire ; s'il est payé (montant exact), prolonge la formule. */
export async function refreshBillingPayment(id: number, userId?: number) {
  const [bp] = await db.select().from(billingPayments).where(userId ? and(eq(billingPayments.id, id), eq(billingPayments.userId, userId)) : eq(billingPayments.id, id)).limit(1)
  if (!bp) throw new HttpError(404, 'Paiement introuvable', 'not_found')
  if (bp.status !== 'pending' || !bp.providerRef) return bp.status
  if (bp.provider === 'orchestrator') {
    // Lecture serveur de la session (jamais la parole du navigateur) ; montant et devise vérifiés.
    const acc = await platformPo()
    if (!acc) return 'pending'
    let s: PoSessionLite
    try {
      s = await po<PoSessionLite>(acc.secretKey, `/checkout/sessions/${bp.providerRef}`)
    } catch {
      return 'pending'
    }
    if (s.status === 'expired' && s.payment_status !== 'paid') {
      await db.update(billingPayments).set({ status: 'failed', error: 'Session expirée sans paiement (page de paiement fermée ou abandonnée)' }).where(eq(billingPayments.id, bp.id))
      return 'failed'
    }
    if (s.payment_status !== 'paid') return 'pending'
    if (Math.abs(Number(s.amount) - bp.amount) > 0.005 || s.currency !== bp.currency) {
      console.warn(`[billing po] montant incohérent pour ${bp.id}: ${s.amount} ${s.currency} au lieu de ${bp.amount} ${bp.currency}`)
      return 'pending'
    }
    const [done] = await db.update(billingPayments).set({ status: 'paid', paidAt: new Date() }).where(and(eq(billingPayments.id, bp.id), eq(billingPayments.status, 'pending'))).returning()
    if (done) await extendSubscription(bp.userId, bp.plan, bp.months, 'paid')
    return 'paid'
  }
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
/** Promotion en cours sur les formules (Black Friday par défaut), ou null si aucune n'est active. */
export async function billingPromo(): Promise<BillingPromo | null> {
  const p = await getSetting<BillingPromo>('billing.promo', DEFAULT_PROMO)
  return promoActive(p) ? p : null
}

export async function extendSubscription(userId: number, plan: PlanId, months: number, source: 'paid' | 'offered', note?: string) {
  const [cur] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  let start = cur && cur.currentPeriodEnd > new Date() && cur.plan === plan ? cur.currentPeriodEnd : new Date()
  // Payé pendant l'offre de lancement (tout gratuit) : la période payée commence à la fin de l'offre, rien n'est perdu.
  const launchEnd = new Date(LAUNCH.unlimitedUntil)
  if (source === 'paid' && launchEnd > start) start = launchEnd
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

/** Réconciliation des abonnements payés via Payment Orchestrator (sessions de moins de 24 h). */
export async function reconcilePoBilling() {
  const rows = await db
    .select({ id: billingPayments.id })
    .from(billingPayments)
    .where(and(eq(billingPayments.provider, 'orchestrator'), eq(billingPayments.status, 'pending'), gte(billingPayments.createdAt, new Date(Date.now() - 24 * 3600_000))))
    .limit(100)
  let paid = 0
  for (const r of rows) if ((await refreshBillingPayment(r.id)) === 'paid') paid++
  return { checked: rows.length, paid }
}
