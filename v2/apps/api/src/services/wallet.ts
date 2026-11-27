/**
 * Portefeuille des boutiques de produits digitaux.
 *
 * Quand le super admin ouvre le portefeuille d'une boutique, ses paiements en ligne passent par le compte
 * Payment Orchestrator de la plateforme. Chaque vente payée crédite la boutique (moins la commission de sa
 * formule), disponible après un délai de sécurité. La boutique demande un retrait vers son Mobile Money ;
 * le super admin le valide puis le verse.
 *
 * Registre en ajout seul (wallet_entries) : un solde est toujours une somme, jamais un champ modifié.
 */
import { PLANS, type PlanId } from '@zuri/shared'
import { and, desc, eq, sql as dsql } from 'drizzle-orm'
import { db, type Tx } from '../db/client'
import { orders, stores, walletEntries, withdrawals, type Order, type Store, type Withdrawal } from '../db/schema'
import { badRequest, conflict, notFound } from '../lib/errors'
import { roundMoney } from './pricing'
import { getSetting, planForStore, setSetting } from './platform'

export type WalletConfig = {
  /** Jours avant qu'une vente devienne retirable. */
  holdDays: number
  /** Retrait minimum, dans la devise de la boutique. */
  minWithdrawal: number
  /** Commission (%) par formule. */
  commission: Record<PlanId, number>
}
export const DEFAULT_WALLET_CONFIG: WalletConfig = { holdDays: 3, minWithdrawal: 5000, commission: { free: 10, starter: 7, pro: 5, business: 3 } }

export async function walletConfig(): Promise<WalletConfig> {
  const v = await getSetting<Partial<WalletConfig> | null>('wallet.config', null)
  return { ...DEFAULT_WALLET_CONFIG, ...v, commission: { ...DEFAULT_WALLET_CONFIG.commission, ...v?.commission } }
}
export async function saveWalletConfig(c: WalletConfig) {
  await setSetting('wallet.config', c)
}

/** Commission appliquée à une boutique : la sienne si le super admin l'a fixée, sinon celle de sa formule. */
export async function commissionFor(store: Pick<Store, 'id' | 'walletCommissionPct'>): Promise<{ pct: number; plan: PlanId }> {
  const plan = (await planForStore(store.id)).plan
  if (store.walletCommissionPct != null) return { pct: Number(store.walletCommissionPct), plan }
  return { pct: (await walletConfig()).commission[plan] ?? 0, plan }
}

/** Vente payée via la plateforme : crédit (moins commission), retirable après le délai. Une seule fois par commande. */
export async function creditSale(tx: Tx, order: Order) {
  const [store] = await tx.select().from(stores).where(eq(stores.id, order.storeId)).limit(1)
  if (!store) return
  const cfg = await walletConfig()
  const { pct, plan } = await commissionFor(store)
  const total = Number(order.total)
  const fee = roundMoney((total * pct) / 100, order.currency)
  const availableAt = new Date(Date.now() + cfg.holdDays * 86400_000)
  const base = { storeId: order.storeId, currency: order.currency, orderId: order.id, availableAt }
  await tx
    .insert(walletEntries)
    .values([
      { ...base, type: 'sale', amount: total, note: `Commande ${order.orderNumber}` },
      ...(fee > 0 ? [{ ...base, type: 'commission' as const, amount: -fee, note: `Commission ${pct} % (formule ${PLANS[plan].name})` }] : []),
    ])
    .onConflictDoNothing()
}

/** Commande remboursée : le net de la vente est retiré du portefeuille (une seule fois). */
export async function debitRefund(tx: Tx, order: Order) {
  const rows = await tx.select({ amount: walletEntries.amount, type: walletEntries.type }).from(walletEntries).where(eq(walletEntries.orderId, order.id))
  if (!rows.some((r) => r.type === 'sale') || rows.some((r) => r.type === 'refund')) return
  const net = rows.filter((r) => r.type === 'sale' || r.type === 'commission').reduce((s, r) => s + Number(r.amount), 0)
  if (net <= 0) return
  await tx.insert(walletEntries).values({ storeId: order.storeId, type: 'refund', amount: -net, currency: order.currency, orderId: order.id, note: `Remboursement commande ${order.orderNumber}` }).onConflictDoNothing()
}

/** Soldes : disponible (retirable maintenant), en attente (délai de sécurité), total gagné, total retiré. */
export async function walletBalances(storeId: string, run: Pick<Tx, 'select'> = db) {
  const [r] = await run
    .select({
      available: dsql<string>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.availableAt} <= now()), 0)`,
      pending: dsql<string>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.availableAt} > now()), 0)`,
      earned: dsql<string>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('sale', 'commission', 'refund')), 0)`,
      withdrawn: dsql<string>`coalesce(-sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('withdrawal', 'withdrawal_reversal')), 0)`,
    })
    .from(walletEntries)
    .where(eq(walletEntries.storeId, storeId))
  return { available: Number(r?.available ?? 0), pending: Number(r?.pending ?? 0), earned: Number(r?.earned ?? 0), withdrawn: Number(r?.withdrawn ?? 0) }
}

export type WithdrawalInput = { amount: number; phone: string; network: string; country: string; holderName?: string }

/** Demande de retrait : le montant est réservé tout de suite (débit), rendu si le retrait est refusé ou échoue. */
export async function requestWithdrawal(store: Store, userId: number, input: WithdrawalInput): Promise<Withdrawal> {
  if (!store.walletEnabled) throw badRequest('Le portefeuille n’est pas activé pour cette boutique', 'wallet_disabled')
  const cfg = await walletConfig()
  const amount = roundMoney(input.amount, store.currency)
  if (amount < cfg.minWithdrawal) throw badRequest(`Retrait minimum : ${cfg.minWithdrawal} ${store.currency}`, 'withdrawal_min')
  const w = await db.transaction(async (tx) => {
    // Une demande à la fois par boutique : deux clics simultanés ne peuvent pas retirer deux fois.
    await tx.execute(dsql`select pg_advisory_xact_lock(hashtext(${`wallet:${store.id}`}))`)
    const [open] = await tx.select({ id: withdrawals.id }).from(withdrawals).where(and(eq(withdrawals.storeId, store.id), dsql`${withdrawals.status} in ('pending', 'approved', 'processing')`)).limit(1)
    if (open) throw conflict('Un retrait est déjà en cours de traitement. Attendez qu’il soit versé pour en demander un autre.', 'withdrawal_open')
    const { available } = await walletBalances(store.id, tx)
    if (amount > available) throw badRequest(`Solde disponible insuffisant (${available} ${store.currency})`, 'insufficient_balance')
    const [row] = await tx
      .insert(withdrawals)
      .values({ storeId: store.id, amount, currency: store.currency, phone: input.phone, network: input.network, country: input.country, holderName: input.holderName ?? null, requestedBy: userId })
      .returning()
    await tx.insert(walletEntries).values({ storeId: store.id, type: 'withdrawal', amount: -amount, currency: store.currency, withdrawalId: row!.id, note: `Retrait vers ${input.network} ${input.phone}` })
    await tx.update(stores).set({ walletPayoutTo: { phone: input.phone, network: input.network, country: input.country, name: input.holderName } }).where(eq(stores.id, store.id))
    return row!
  })
  const { notifyPlatformAdmins } = await import('./admin-notify')
  await notifyPlatformAdmins({ title: 'Demande de retrait', body: `${store.name} demande ${amount} ${store.currency} vers ${input.network} ${input.phone}.`, path: '/admin/withdrawals', tag: `withdrawal-${w.id}` }).catch(() => 0)
  return w
}

const FINAL = new Set(['paid', 'rejected', 'failed', 'cancelled'])

/** Retrait annulé (vendeur), refusé ou échoué (super admin) : le montant revient dans le portefeuille. */
export async function closeWithdrawal(id: number, status: 'rejected' | 'failed' | 'cancelled', by: { userId: number; storeId?: string; reason?: string }) {
  return db.transaction(async (tx) => {
    const [w] = await tx.select().from(withdrawals).where(eq(withdrawals.id, id)).for('update').limit(1)
    if (!w || (by.storeId && w.storeId !== by.storeId)) throw notFound('Retrait')
    if (FINAL.has(w.status)) throw conflict('Ce retrait est déjà terminé', 'withdrawal_final')
    if (status === 'cancelled' && w.status !== 'pending') throw conflict('Ce retrait a déjà été validé : il ne peut plus être annulé', 'withdrawal_locked')
    const [row] = await tx.update(withdrawals).set({ status, reason: by.reason ?? null, reviewedBy: by.userId, reviewedAt: new Date() }).where(eq(withdrawals.id, id)).returning()
    const label = status === 'cancelled' ? 'annulé' : status === 'rejected' ? 'refusé' : 'échoué'
    await tx.insert(walletEntries).values({ storeId: w.storeId, type: 'withdrawal_reversal', amount: Number(w.amount), currency: w.currency, withdrawalId: w.id, note: `Retrait ${label}${by.reason ? ` : ${by.reason}` : ''}` })
    return row!
  })
}

/** Super admin : retrait validé (à verser), puis marqué payé avec la référence du transfert. */
export async function reviewWithdrawal(id: number, action: 'approve' | 'paid', userId: number, reference?: string) {
  const [w] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1)
  if (!w) throw notFound('Retrait')
  if (FINAL.has(w.status)) throw conflict('Ce retrait est déjà terminé', 'withdrawal_final')
  if (action === 'approve') {
    if (w.status !== 'pending') throw conflict('Ce retrait est déjà validé', 'withdrawal_state')
    const [row] = await db.update(withdrawals).set({ status: 'approved', reviewedBy: userId, reviewedAt: new Date() }).where(eq(withdrawals.id, id)).returning()
    return row!
  }
  const [row] = await db.update(withdrawals).set({ status: 'paid', paidAt: new Date(), reference: reference?.trim() || null, reviewedBy: w.reviewedBy ?? userId, reviewedAt: w.reviewedAt ?? new Date() }).where(eq(withdrawals.id, id)).returning()
  return row!
}

/** Historique d'une boutique : derniers mouvements (avec le numéro de commande) et derniers retraits. */
export async function walletHistory(storeId: string) {
  const entries = await db
    .select({ id: walletEntries.id, type: walletEntries.type, amount: walletEntries.amount, currency: walletEntries.currency, note: walletEntries.note, availableAt: walletEntries.availableAt, createdAt: walletEntries.createdAt, orderId: walletEntries.orderId, orderNumber: orders.orderNumber })
    .from(walletEntries)
    .leftJoin(orders, eq(orders.id, walletEntries.orderId))
    .where(eq(walletEntries.storeId, storeId))
    .orderBy(desc(walletEntries.createdAt), desc(walletEntries.id))
    .limit(100)
  const list = await db.select().from(withdrawals).where(eq(withdrawals.storeId, storeId)).orderBy(desc(withdrawals.createdAt)).limit(30)
  return { entries, withdrawals: list }
}

/** Email au propriétaire de la boutique quand son retrait est versé, refusé ou échoué. */
export async function notifyWithdrawal(w: Withdrawal) {
  const { storeMembers, users } = await import('../db/schema')
  const [owner] = await db
    .select({ email: users.email, name: users.name, store: stores.name })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(and(eq(storeMembers.storeId, w.storeId), eq(storeMembers.role, 'owner')))
    .limit(1)
  if (!owner) return
  const { sendEmail } = await import('./notify')
  const { layout } = await import('./emails')
  const { escapeHtml } = await import('../lib/sanitize')
  const amount = `${Number(w.amount).toLocaleString('fr-FR')} ${w.currency}`
  const subject = w.status === 'paid' ? `Retrait versé : ${amount}` : `Retrait non versé : ${amount}`
  const body =
    w.status === 'paid'
      ? `<p>Bonne nouvelle : votre retrait de <strong>${escapeHtml(amount)}</strong> a été envoyé sur ${escapeHtml(w.network)} ${escapeHtml(w.phone)}.</p>${w.reference ? `<p>Référence : ${escapeHtml(w.reference)}</p>` : ''}`
      : `<p>Votre retrait de <strong>${escapeHtml(amount)}</strong> n’a pas pu être versé${w.reason ? ` : ${escapeHtml(w.reason)}` : ''}.</p><p>Le montant est revenu dans votre portefeuille : vous pouvez refaire une demande.</p>`
  await sendEmail(owner.email, subject, layout(owner.store, body))
}
