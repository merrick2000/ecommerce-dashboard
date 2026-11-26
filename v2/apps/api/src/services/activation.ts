/**
 * Démarrage des vendeurs : comprendre pourquoi une boutique reste sans produit, et relancer.
 * - Étapes enregistrées (ouverture de la création de produit, erreur à l'enregistrement, produit créé).
 * - Question « Qu'est-ce qui vous bloque ? » : un clic depuis l'email (lien signé) ou dans le tableau de bord.
 * - Email « Ajoutez votre premier produit » envoyé d'un clic par le super admin à toutes les boutiques vides.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, desc, eq, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { onboardingEmails, sellerEvents, sellerFeedback, users } from '../db/schema'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { button, layout, small } from './emails'
import { sendEmail } from './notify'
import { langOf, unsubscribeUrl } from './onboarding'
import { getSetting } from './platform'

export const BLOCKERS = {
  no_photos: { fr: 'Je n’ai pas encore de photos', en: 'I don’t have photos yet' },
  what_to_sell: { fr: 'Je ne sais pas encore quoi vendre', en: 'I don’t know what to sell yet' },
  too_complex: { fr: 'C’est compliqué, je ne sais pas comment faire', en: 'It’s complicated, I don’t know how' },
  payment_delivery: { fr: 'Je ne sais pas comment gérer paiement ou livraison', en: 'I’m not sure about payment or delivery' },
  just_looking: { fr: 'Je voulais juste découvrir', en: 'I just wanted to look around' },
  other: { fr: 'Autre chose', en: 'Something else' },
} as const
export type Blocker = keyof typeof BLOCKERS
export const BLOCKER_IDS = Object.keys(BLOCKERS) as Blocker[]

export const SELLER_EVENT_TYPES = ['product_editor_open', 'product_import_open', 'product_save_error', 'product_created'] as const
export type SellerEventType = (typeof SELLER_EVENT_TYPES)[number]

export async function logSellerEvent(userId: number, type: SellerEventType, storeId?: string | null, data?: Record<string, unknown>) {
  await db.insert(sellerEvents).values({ userId, type, storeId: storeId ?? null, data: data ?? null }).catch(() => undefined)
}

// ─── Réponse en un clic depuis l'email ─────────────────────────────────────

const key = () => Buffer.from(env.APP_KEY, 'base64')
const blockerSig = (userId: number, answer: string) => createHmac('sha256', key()).update(`blocker:${userId}:${answer}`).digest('base64url').slice(0, 24)

export const blockerUrl = (userId: number, answer: Blocker) => `${env.APP_URL.replace(/\/$/, '')}/api/v1/feedback/blocker?u=${userId}&a=${answer}&t=${blockerSig(userId, answer)}`

export function checkBlocker(userId: number, answer: string, token: string): boolean {
  const a = Buffer.from(blockerSig(userId, answer))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function recordBlocker(userId: number, answer: Blocker, source: 'email' | 'dashboard', detail?: string | null) {
  await db.insert(sellerFeedback).values({ userId, kind: 'blocker', answer, source, detail: detail?.trim().slice(0, 1000) || null })
}

/** Aide adaptée à la réponse, affichée juste après le clic. */
export function blockerHelp(answer: Blocker, lang: 'fr' | 'en'): string {
  const en = lang === 'en'
  switch (answer) {
    case 'no_photos':
      return en ? 'Photos taken with your phone in daylight are enough. You can also start with one photo and add more later.' : 'Des photos prises au téléphone, à la lumière du jour, suffisent. Vous pouvez commencer avec une seule photo et en ajouter plus tard.'
    case 'what_to_sell':
      return en ? 'Start with what you already sell on WhatsApp or Facebook, or with a product your customers often ask for.' : 'Commencez par ce que vous vendez déjà sur WhatsApp ou Facebook, ou par un produit que vos clients demandent souvent.'
    case 'too_complex':
      return en ? 'Write to us on WhatsApp: we will add your first product with you, step by step.' : 'Écrivez-nous sur WhatsApp : on ajoute votre premier produit avec vous, étape par étape.'
    case 'payment_delivery':
      return en ? 'Start with cash on delivery: the customer pays the rider. Then add your delivery cities and fees.' : 'Commencez par le paiement à la livraison : le client paie le livreur. Ajoutez ensuite vos villes et vos frais de livraison.'
    case 'just_looking':
      return en ? 'No problem. Your store stays free and ready whenever you want.' : 'Aucun souci. Votre boutique reste gratuite et prête quand vous voulez.'
    default:
      return en ? 'Thank you. Tell us more by replying to our email or on WhatsApp.' : 'Merci. Dites-nous en plus en répondant à notre email ou sur WhatsApp.'
  }
}

// ─── Email « Ajoutez votre premier produit » ───────────────────────────────

const choiceLinks = (userId: number, lang: 'fr' | 'en') =>
  BLOCKER_IDS.map((b) => `<a href="${blockerUrl(userId, b)}" style="display:block;margin:6px 0;padding:10px 12px;border:1px solid #e4e4e7;border-radius:10px;color:#18181b;text-decoration:none">${escapeHtml(BLOCKERS[b][lang])}</a>`).join('')

/** Bloc « Quelque chose vous bloque ? » pour les autres emails (relances automatiques). */
export const blockerChoices = (userId: number, lang: 'fr' | 'en') =>
  `<p style="margin-top:22px"><strong>${lang === 'en' ? 'Something holding you back? One click is enough:' : 'Quelque chose vous bloque ? Un clic suffit :'}</strong></p>${choiceLinks(userId, lang)}`

export function firstProductEmail(c: { userId: number; name: string; lang: 'fr' | 'en'; storeName: string; link: string; whatsapp: string | null }) {
  const en = c.lang === 'en'
  const first = escapeHtml(c.name.trim().split(/\s+/)[0] ?? '')
  const store = escapeHtml(c.storeName)
  const steps = en
    ? ['<strong>A photo, a price, two lines of description.</strong> Your sales page is ready, with the order form.', '<strong>Share the link</strong> on WhatsApp, Facebook or TikTok.', '<strong>Receive orders</strong> on your phone, paid on delivery or by Mobile Money.']
    : ['<strong>Une photo, un prix, deux lignes de description.</strong> Votre page de vente est prête, avec le formulaire de commande.', '<strong>Partagez le lien</strong> sur WhatsApp, Facebook ou TikTok.', '<strong>Recevez les commandes</strong> sur votre téléphone, payées à la livraison ou par Mobile Money.']
  const choices = choiceLinks(c.userId, c.lang)
  const help = c.whatsapp
    ? en
      ? ` Need help right now? Write to us on WhatsApp (${escapeHtml(c.whatsapp)}).`
      : ` Besoin d’aide tout de suite ? Écrivez-nous sur WhatsApp (${escapeHtml(c.whatsapp)}).`
    : en
      ? ' Need help right now? Just reply to this email.'
      : ' Besoin d’aide tout de suite ? Répondez simplement à cet email.'
  const subject = en ? `${c.storeName} is waiting for its first product` : `${c.storeName} attend son premier produit`
  const html = layout(
    'Zuri',
    `<p>${en ? 'Hi' : 'Bonjour'} ${first},</p>
<p>${en ? `Your store <strong>${store}</strong> is created, but it has no product yet. It takes 2 minutes, from your phone:` : `Votre boutique <strong>${store}</strong> est créée, mais elle n’a pas encore de produit. Ça prend 2 minutes, depuis votre téléphone :`}</p>
<ol style="padding-left:20px;margin:12px 0">${steps.map((s) => `<li style="margin-bottom:8px">${s}</li>`).join('')}</ol>
${button(c.link, en ? 'Add my first product' : 'Ajouter mon premier produit')}
<p style="margin-top:22px"><strong>${en ? 'Something holding you back? One click is enough:' : 'Quelque chose vous bloque ? Un clic suffit :'}</strong></p>
${choices}
<p>${en ? 'We read every answer.' : 'On lit chaque réponse.'}${help}</p>
${small(`${en ? 'No more emails like this?' : 'Ne plus recevoir ces emails ?'} <a href="${unsubscribeUrl(c.userId)}">${en ? 'Unsubscribe' : 'Se désinscrire'}</a>`)}`,
    '#f59e0b',
    c.lang,
  )
  return { subject, html }
}

const CAMPAIGN = 'first_product_mail'

/** Vendeurs avec une boutique mais aucun produit, joignables par email. */
async function emptyStoreSellers() {
  return db.execute<{ id: number; email: string; name: string; signup_source: { from?: string; landing?: string; lang?: string } | null; store_id: string; store_name: string; store_locale: string | null; already: boolean }>(dsql`
    select u.id::int as id, u.email, u.name, u.signup_source, st.id as store_id, st.name as store_name, st.locale as store_locale,
      exists (select 1 from onboarding_emails e where e.user_id = u.id and e.kind = ${CAMPAIGN}) as already
    from users u
    join lateral (
      select s.id, s.name, s.locale from stores s join store_members m on m.store_id = s.id and m.role = 'owner'
      where m.user_id = u.id and s.closed_at is null order by s.created_at limit 1
    ) st on true
    where u.is_platform_admin = false and u.disabled_at is null
      and not exists (select 1 from products p join store_members m on m.store_id = p.store_id and m.role = 'owner' where m.user_id = u.id)`)
}

/** Envoi (une seule fois par vendeur) ; renvoie le nombre d'emails partis. */
export async function sendFirstProductCampaign(): Promise<number> {
  const rows = await emptyStoreSellers()
  const whatsapp = await getSetting<string | null>('contact.whatsapp', null)
  const replyTo = await getSetting<string | null>('contact.email', null)
  const app = env.APP_URL.replace(/\/$/, '')
  const optedOut = new Set(
    (await db.select({ id: users.id }).from(users).where(dsql`${users.emailOptOutAt} is not null`)).map((r) => r.id),
  )
  let sent = 0
  for (const r of rows) {
    if (r.already || optedOut.has(r.id)) continue
    const claimed = await db.insert(onboardingEmails).values({ userId: r.id, kind: CAMPAIGN, step: 1 }).onConflictDoNothing().returning({ id: onboardingEmails.id })
    if (!claimed.length) continue
    const mail = firstProductEmail({ userId: r.id, name: r.name, lang: langOf(r.signup_source, r.store_locale), storeName: r.store_name, link: `${app}/stores/${r.store_id}/products/new`, whatsapp })
    await sendEmail(r.email, mail.subject, mail.html, { fromName: 'Zuri', ...(replyTo ? { replyTo } : {}) }).catch(() => undefined)
    sent++
  }
  return sent
}

// ─── Rapport pour le super admin ───────────────────────────────────────────

export async function activationReport() {
  const sellers = await emptyStoreSellers()
  const ids = sellers.map((s) => s.id)
  const inList = ids.length ? dsql`(${dsql.join(ids.map((i) => dsql`${i}`), dsql`, `)})` : dsql`(null)`
  const [steps] = await db.execute<{ opened: number; imported: number; tried: number }>(dsql`
    select
      count(distinct user_id) filter (where type = 'product_editor_open')::int as opened,
      count(distinct user_id) filter (where type = 'product_import_open')::int as imported,
      count(distinct user_id) filter (where type = 'product_save_error')::int as tried
    from seller_events where user_id in ${inList}`)
  const errors = await db.execute<{ message: string; n: number }>(dsql`
    select coalesce(data->>'message', 'Erreur inconnue') as message, count(*)::int as n
    from seller_events where type = 'product_save_error' and created_at > now() - interval '60 days'
    group by 1 order by n desc limit 10`)
  const blockers = await db.execute<{ answer: string; n: number }>(dsql`
    select answer, count(*)::int as n from (
      select distinct on (user_id) user_id, answer from seller_feedback where kind = 'blocker' order by user_id, created_at desc
    ) last group by answer order by n desc`)
  const recent = await db
    .select({ answer: sellerFeedback.answer, detail: sellerFeedback.detail, source: sellerFeedback.source, at: sellerFeedback.createdAt, userId: users.id, name: users.name, email: users.email })
    .from(sellerFeedback)
    .innerJoin(users, eq(users.id, sellerFeedback.userId))
    .where(eq(sellerFeedback.kind, 'blocker'))
    .orderBy(desc(sellerFeedback.createdAt))
    .limit(30)
  const [camp] = await db.execute<{ sent: number; last: string | null }>(dsql`select count(*)::int as sent, max(created_at) as last from onboarding_emails where kind = ${CAMPAIGN}`)
  return {
    emptyStores: sellers.length,
    steps: { opened: steps?.opened ?? 0, imported: steps?.imported ?? 0, tried: steps?.tried ?? 0 },
    saveErrors: errors.map((e) => ({ message: e.message, count: e.n })),
    blockers: blockers.map((b) => ({ answer: b.answer, label: BLOCKERS[b.answer as Blocker]?.fr ?? b.answer, count: b.n })),
    recent: recent.map((r) => ({ ...r, label: BLOCKERS[r.answer as Blocker]?.fr ?? r.answer })),
    campaign: { eligible: sellers.filter((s) => !s.already).length, sent: camp?.sent ?? 0, lastSentAt: camp?.last ?? null },
    sellers: sellers.slice(0, 200).map((s) => ({ id: s.id, name: s.name, email: s.email, storeName: s.store_name, mailed: s.already })),
  }
}

export async function myLastBlocker(userId: number) {
  const [r] = await db.select().from(sellerFeedback).where(and(eq(sellerFeedback.userId, userId), eq(sellerFeedback.kind, 'blocker'))).orderBy(desc(sellerFeedback.createdAt)).limit(1)
  return r ?? null
}
