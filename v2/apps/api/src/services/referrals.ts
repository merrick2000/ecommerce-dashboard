/**
 * Parrainage : chaque vendeur a un lien (zurisell.store/?ref=CODE). Quand un filleul fait sa première vente
 * (payée ou livrée, hors saisie manuelle), parrain et filleul reçoivent chacun un mois Pro offert.
 * Le mois commence après l'offre de lancement si elle court encore. Parrain plafonné à 12 mois gagnés.
 */
import { randomInt } from 'node:crypto'
import { LAUNCH } from '@zuri/shared'
import { and, eq, isNotNull, isNull, ne, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { subscriptions, users, type User } from '../db/schema'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { button, layout, small } from './emails'
import { sendPushToUser } from './notifications'
import { sendEmail } from './notify'
import { langOf } from './onboarding'
import { storeOwner } from './platform'

export const REFERRAL_PLAN = 'pro' as const
export const REFERRAL_MONTHS = 1
export const REFERRAL_CAP = 12

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Code du compte, créé à la demande (6 caractères sans 0/O ni 1/I pour éviter les confusions). */
export async function referralCodeFor(userId: number): Promise<string> {
  const [u] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1)
  if (u?.code) return u.code
  for (let i = 0; i < 8; i++) {
    const code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
    const [row] = await db.update(users).set({ referralCode: code }).where(and(eq(users.id, userId), isNull(users.referralCode))).returning({ code: users.referralCode }).catch(() => [])
    if (row?.code) return row.code
    const [again] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1)
    if (again?.code) return again.code
  }
  throw new Error('Code de parrainage impossible à créer')
}

export const referralLink = (code: string) => `https://zurisell.store/?ref=${code}`

/** À l'inscription : relie le nouveau compte à son parrain si un code valide a été retenu. */
export async function linkReferral(user: Pick<User, 'id' | 'signupSource'>) {
  const code = user.signupSource?.ref
  if (!code) return
  const [parent] = await db.select({ id: users.id }).from(users).where(and(eq(users.referralCode, code), ne(users.id, user.id))).limit(1)
  if (parent) await db.update(users).set({ referredBy: parent.id }).where(and(eq(users.id, user.id), isNull(users.referredBy)))
}

/** Mois offert : à la suite de l'abonnement Pro en cours, ou après l'offre de lancement si elle court encore. */
async function offerMonth(userId: number, note: string) {
  const [cur] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  const launchEnd = new Date(LAUNCH.unlimitedUntil)
  const now = new Date()
  let start = launchEnd > now ? launchEnd : now
  if (cur && cur.plan === REFERRAL_PLAN && cur.currentPeriodEnd > start) start = cur.currentPeriodEnd
  const end = new Date(start)
  end.setMonth(end.getMonth() + REFERRAL_MONTHS)
  await db
    .insert(subscriptions)
    .values({ userId, plan: REFERRAL_PLAN, currentPeriodEnd: end, source: 'offered', note })
    .onConflictDoUpdate({ target: subscriptions.userId, set: { plan: REFERRAL_PLAN, currentPeriodEnd: end, source: 'offered', note, updatedAt: now } })
  return end
}

function rewardEmail(lang: 'fr' | 'en', name: string, role: 'parent' | 'child', other: string) {
  const en = lang === 'en'
  const first = escapeHtml(name.split(/\s+/)[0] ?? '')
  const who = escapeHtml(other.split(/\s+/)[0] ?? '')
  const app = env.APP_URL.replace(/\/$/, '')
  const subject = en ? 'You earned a free month of Zuri Pro' : 'Vous avez gagné un mois de Zuri Pro'
  const text =
    role === 'parent'
      ? en
        ? `<p>${who}, who joined Zuri with your link, just made their first sale. As promised, you both get one month of Zuri Pro for free.</p><p>Keep sharing your link: every seller who makes a first sale gives you another month.</p>`
        : `<p>${who}, inscrit grâce à votre lien, vient de faire sa première vente. Comme promis, vous gagnez tous les deux un mois de Zuri Pro offert.</p><p>Continuez à partager votre lien : chaque vendeur qui fait sa première vente vous rapporte un mois de plus.</p>`
      : en
        ? `<p>Congratulations on your first sale. Because you joined with ${who}’s link, you get one month of Zuri Pro for free.</p>`
        : `<p>Bravo pour votre première vente. Comme vous êtes arrivé grâce au lien de ${who}, vous gagnez un mois de Zuri Pro offert.</p>`
  return {
    subject,
    html: layout('Zuri', `<p>${en ? 'Hi' : 'Bonjour'} ${first},</p>${text}${button(`${app}/referrals`, en ? 'See my referrals' : 'Voir mon parrainage')}${small(en ? 'Free month added to your subscription, nothing to do.' : 'Mois ajouté automatiquement à votre abonnement, rien à faire.')}`, '#f59e0b', lang),
  }
}

/** Après une vente payée ou livrée : récompense le filleul (première vente) et son parrain, une seule fois. */
export async function checkReferralReward(storeId: string): Promise<boolean> {
  const owner = await storeOwner(storeId)
  if (!owner?.referredBy || owner.referralRewardedAt) return false
  const [sale] = await db.execute<{ n: number }>(dsql`
    select count(*)::int as n from orders o join store_members m on m.store_id = o.store_id and m.role = 'owner'
    where m.user_id = ${owner.id} and o.source <> 'manual' and (o.payment_status = 'paid' or o.fulfillment_status = 'delivered')`)
  if (!sale?.n) return false
  // Réservation : deux ventes simultanées ne paient jamais deux fois.
  const [claimed] = await db.update(users).set({ referralRewardedAt: new Date() }).where(and(eq(users.id, owner.id), isNull(users.referralRewardedAt))).returning({ id: users.id })
  if (!claimed) return false
  const [parent] = await db.select().from(users).where(eq(users.id, owner.referredBy)).limit(1)
  await offerMonth(owner.id, 'Parrainage : première vente')
  if (parent && !parent.disabledAt) {
    const [{ n } = { n: 0 }] = await db.select({ n: dsql<number>`count(*)::int` }).from(users).where(and(eq(users.referredBy, parent.id), isNotNull(users.referralRewardedAt)))
    // Plafond : au-delà de 12 filleuls récompensés, seul le filleul reçoit son mois.
    if (n <= REFERRAL_CAP) {
      await offerMonth(parent.id, `Parrainage : première vente de ${owner.name}`)
      const mail = rewardEmail(langOf(parent.signupSource), parent.name, 'parent', owner.name)
      await sendEmail(parent.email, mail.subject, mail.html, { fromName: 'Zuri' }).catch(() => undefined)
      await sendPushToUser(parent.id, { title: mail.subject, body: `${owner.name.split(/\s+/)[0]} a fait sa première vente grâce à votre lien.`, url: `${env.APP_URL.replace(/\/$/, '')}/referrals`, event: 'platform', sound: 'sale' }).catch(() => 0)
    }
  }
  const mail = rewardEmail(langOf(owner.signupSource), owner.name, 'child', parent?.name ?? '')
  await sendEmail(owner.email, mail.subject, mail.html, { fromName: 'Zuri' }).catch(() => undefined)
  return true
}
