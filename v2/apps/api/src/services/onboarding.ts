/**
 * Accompagnement des nouveaux vendeurs : un email au bon moment pour chaque étape où ils bloquent.
 * - no_store   : compte créé, pas de boutique (après 1 jour, puis 3 jours) ;
 * - no_product : boutique créée, pas de produit (après 1 jour, puis 3 jours) ;
 * - no_order   : produit en ligne, aucune commande (après 3 jours, puis 7 jours).
 * Chaque étape part une seule fois, jamais deux emails le même jour, et seulement pendant le premier mois.
 * Langue : celle de la page d'inscription (pages /en → anglais). Désinscription en un clic.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { onboardingEmails, users } from '../db/schema'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { button, layout, small } from './emails'
import { sendEmail } from './notify'
import { getSetting } from './platform'

export type OnboardingKind = 'no_store' | 'no_product' | 'no_order'
type Lang = 'fr' | 'en'

const HOUR = 3600_000
/** Délai avant chaque étape, compté depuis le début de l'étape (inscription, boutique, premier produit). */
const DELAYS: Record<OnboardingKind, number[]> = {
  no_store: [24 * HOUR, 72 * HOUR],
  no_product: [24 * HOUR, 72 * HOUR],
  no_order: [72 * HOUR, 7 * 24 * HOUR],
}
/** Écart minimal entre deux emails d'accompagnement au même vendeur. */
const GAP = 40 * HOUR
/** Au-delà, on ne relance plus (comptes anciens). */
const WINDOW_DAYS = 30

/**
 * Langue des emails d'un vendeur : celle de sa boutique s'il en a une (réglage Paramètres, Langue),
 * sinon la page d'inscription (/en…), sinon la langue de son navigateur. Français par défaut.
 */
export const langOf = (src: { from?: string; landing?: string; lang?: string } | null | undefined, storeLocale?: string | null): Lang => {
  if (storeLocale === 'en' || storeLocale === 'fr') return storeLocale
  if (/^\/en(\/|$)/.test(src?.from ?? src?.landing ?? '')) return 'en'
  return src?.lang === 'en' ? 'en' : 'fr'
}

// ─── Désinscription ─────────────────────────────────────────────────────────

const sign = (userId: number) => createHmac('sha256', Buffer.from(env.APP_KEY, 'base64')).update(`unsubscribe:${userId}`).digest('base64url').slice(0, 32)

export const unsubscribeUrl = (userId: number) => `${env.APP_URL.replace(/\/$/, '')}/api/v1/unsubscribe?u=${userId}&t=${sign(userId)}`

export function checkUnsubscribe(userId: number, token: string): boolean {
  const a = Buffer.from(sign(userId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

// ─── Contenu ─────────────────────────────────────────────────────────────────

const first = (name: string) => escapeHtml(name.trim().split(/\s+/)[0] ?? '')
const list = (items: string[]) => `<ul style="padding-left:20px;margin:12px 0">${items.map((i) => `<li style="margin-bottom:8px">${i}</li>`).join('')}</ul>`

interface Ctx {
  name: string
  lang: Lang
  appUrl: string
  storeName?: string | null
  storeUrl?: string | null
  unsubscribe: string
  whatsapp?: string | null
}

export function onboardingEmail(kind: OnboardingKind, step: number, c: Ctx): { subject: string; html: string } {
  const en = c.lang === 'en'
  const help = c.whatsapp
    ? en
      ? `Stuck somewhere? Reply to this email or <a href="https://wa.me/${c.whatsapp.replace(/\D/g, '')}">message us on WhatsApp</a>, we answer quickly.`
      : `Un blocage ? Répondez à cet email ou <a href="https://wa.me/${c.whatsapp.replace(/\D/g, '')}">écrivez-nous sur WhatsApp</a>, on répond vite.`
    : en
      ? 'Stuck somewhere? Just reply to this email, we answer quickly.'
      : 'Un blocage ? Répondez simplement à cet email, on répond vite.'
  const foot = small(
    en
      ? `You receive these tips because you created a Zuri account. <a href="${escapeHtml(c.unsubscribe)}" style="color:#71717a">Stop these emails</a>.`
      : `Vous recevez ces conseils parce que vous avez créé un compte Zuri. <a href="${escapeHtml(c.unsubscribe)}" style="color:#71717a">Ne plus recevoir ces emails</a>.`,
  )
  const hello = en ? `<p>Hi ${first(c.name)},</p>` : `<p>Bonjour ${first(c.name)},</p>`
  const store = escapeHtml(c.storeName ?? (en ? 'your store' : 'votre boutique'))
  let subject = ''
  let body = ''
  let cta = { href: c.appUrl, label: en ? 'Open my dashboard' : 'Ouvrir mon espace' }

  if (kind === 'no_store') {
    subject = step === 1 ? (en ? 'Your store is 2 minutes away' : 'Votre boutique est à 2 minutes') : en ? 'Need a hand to create your store?' : 'Besoin d’un coup de main pour créer votre boutique ?'
    body =
      step === 1
        ? en
          ? `<p>Your Zuri account is ready, but your store is not created yet. It only takes a name, a currency and your country.</p>${list(['<strong>No commission</strong> on your sales.', '<strong>Cash on delivery</strong> and Mobile Money built in.', 'Your orders arrive in real time on your phone.'])}`
          : `<p>Votre compte Zuri est prêt, mais votre boutique n’est pas encore créée. Il suffit d’un nom, d’une devise et de votre pays.</p>${list(['<strong>Aucune commission</strong> sur vos ventes.', '<strong>Paiement à la livraison</strong> et Mobile Money intégrés.', 'Vos commandes arrivent en direct sur votre téléphone.'])}`
        : en
          ? `<p>We noticed you have not created your store yet. If something is holding you back (payment, delivery, how it works), tell us: we will set it up with you.</p>`
          : `<p>Votre boutique n’est toujours pas créée. Si quelque chose vous retient (paiement, livraison, fonctionnement), dites-le nous : on la configure avec vous.</p>`
    cta = { href: c.appUrl, label: en ? 'Create my store' : 'Créer ma boutique' }
  } else if (kind === 'no_product') {
    subject = step === 1 ? (en ? `Add your first product to ${c.storeName ?? 'your store'}` : `Ajoutez votre premier produit à ${c.storeName ?? 'votre boutique'}`) : en ? 'Import a product from a link in 30 seconds' : 'Importez un produit depuis un lien en 30 secondes'
    body =
      step === 1
        ? en
          ? `<p><strong>${store}</strong> is created. Next step: your first product, with its sales page ready to share.</p>${list(['Photos, price and a short description are enough.', 'Choose cash on delivery, online payment, or both.', 'Your page is ready to share on WhatsApp, Facebook or TikTok.'])}`
          : `<p><strong>${store}</strong> est créée. Prochaine étape : votre premier produit, avec sa page de vente prête à partager.</p>${list(['Des photos, un prix et une courte description suffisent.', 'Choisissez paiement à la livraison, en ligne, ou les deux.', 'Votre page est prête à partager sur WhatsApp, Facebook ou TikTok.'])}`
        : en
          ? `<p>Your store is still empty. Quick tip: if your product is already online (Shopify, AliExpress, another site), you can import it from its link. Name, price, photos and description are filled in for you, and the AI organises the text.</p>`
          : `<p>Votre boutique est encore vide. Astuce : si votre produit est déjà en ligne (Shopify, AliExpress, un autre site), importez-le depuis son lien. Nom, prix, photos et description sont repris, et l’IA remet le texte en ordre.</p>`
    cta = { href: c.appUrl, label: en ? 'Add a product' : 'Ajouter un produit' }
  } else {
    subject = step === 1 ? (en ? 'Your page is ready: 3 ways to get your first order' : 'Votre page est prête : 3 façons d’avoir votre première commande') : en ? 'No order yet? Let’s look at it together' : 'Pas encore de commande ? Regardons ensemble'
    body =
      step === 1
        ? en
          ? `<p>Your product is online. Here is what works best to get the first orders:</p>${list(['<strong>WhatsApp</strong>: post the link in your status and send it to your contacts and groups.', '<strong>Ads</strong>: add the tracking parameters shown in Traffic to your Facebook or TikTok ads to see which ad really sells.', '<strong>Bio</strong>: put the link in your Instagram, TikTok and Facebook page bio.'])}${c.storeUrl ? `<p>Your link: <a href="${escapeHtml(c.storeUrl)}">${escapeHtml(c.storeUrl)}</a></p>` : ''}`
          : `<p>Votre produit est en ligne. Voici ce qui marche le mieux pour les premières commandes :</p>${list(['<strong>WhatsApp</strong> : publiez le lien en statut et envoyez-le à vos contacts et groupes.', '<strong>Publicités</strong> : ajoutez les paramètres de suivi (page Trafic) à vos pubs Facebook ou TikTok pour voir quelle pub vend vraiment.', '<strong>Bio</strong> : mettez le lien dans la bio Instagram, TikTok et sur votre page Facebook.'])}${c.storeUrl ? `<p>Votre lien : <a href="${escapeHtml(c.storeUrl)}">${escapeHtml(c.storeUrl)}</a></p>` : ''}`
        : en
          ? `<p>Still no order after a week? It often comes down to a few details: the photos, the price shown, the delivery fees or the order form. Send us your page link: we will tell you what to improve, for free.</p>`
          : `<p>Toujours pas de commande après une semaine ? Cela tient souvent à quelques détails : les photos, le prix affiché, les frais de livraison ou le formulaire. Envoyez-nous le lien de votre page : on vous dit quoi améliorer, gratuitement.</p>`
    cta = { href: c.appUrl, label: en ? 'See my traffic' : 'Voir mon trafic' }
  }
  return { subject, html: layout('Zuri', `${hello}${body}${button(cta.href, cta.label)}<p>${help}</p>${foot}`, '#f59e0b', c.lang) }
}

// ─── Envoi ───────────────────────────────────────────────────────────────────

type Candidate = {
  id: number
  email: string
  name: string
  signup_source: { from?: string; landing?: string; lang?: string } | null
  store_locale: string | null
  created_at: string
  first_store_at: string | null
  store_name: string | null
  store_slug: string | null
  first_product_at: string | null
  orders: number
  sent: { kind: OnboardingKind; step: number; at: string }[] | null
}

/** Étape due pour un vendeur (ou null) : la prochaine non envoyée, si son délai est passé. */
export function dueStep(c: Pick<Candidate, 'created_at' | 'first_store_at' | 'first_product_at' | 'orders' | 'sent'>, now = Date.now()): { kind: OnboardingKind; step: number } | null {
  if (c.orders > 0) return null
  const sent = c.sent ?? []
  const last = Math.max(0, ...sent.map((s) => Date.parse(s.at)))
  if (now - last < GAP) return null
  const [kind, since] = !c.first_store_at ? (['no_store', c.created_at] as const) : !c.first_product_at ? (['no_product', c.first_store_at] as const) : (['no_order', c.first_product_at] as const)
  const done = sent.filter((s) => s.kind === kind).map((s) => s.step)
  const step = DELAYS[kind].findIndex((_, i) => !done.includes(i + 1)) + 1
  if (step === 0) return null
  return now - Date.parse(since) >= DELAYS[kind][step - 1]! ? { kind, step } : null
}

export async function runOnboarding(now = new Date()): Promise<number> {
  // En pleine nuit en Afrique (avant 6 h ou après 20 h UTC), on attend : l'email arrive quand on le lit.
  const h = now.getUTCHours()
  if (h < 6 || h >= 20) return 0
  const rows = await db.execute<Candidate>(dsql`
    select u.id, u.email, u.name, u.signup_source, u.created_at,
      st.first_store_at, st.store_name, st.store_slug, st.store_locale,
      (select min(p.created_at) from products p join store_members m on m.store_id = p.store_id and m.role = 'owner' where m.user_id = u.id) as first_product_at,
      (select count(*)::int from orders o join store_members m on m.store_id = o.store_id and m.role = 'owner' where m.user_id = u.id and o.source <> 'manual') as orders,
      (select json_agg(json_build_object('kind', e.kind, 'step', e.step, 'at', e.created_at)) from onboarding_emails e where e.user_id = u.id) as sent
    from users u
    left join lateral (
      select s.created_at as first_store_at, s.name as store_name, s.slug as store_slug, s.locale as store_locale
      from stores s join store_members m on m.store_id = s.id and m.role = 'owner'
      where m.user_id = u.id order by s.created_at limit 1
    ) st on true
    where u.is_platform_admin = false and u.disabled_at is null and u.email_opt_out_at is null
      and u.created_at >= ${now.toISOString()}::timestamptz - interval '${dsql.raw(String(WINDOW_DAYS))} days'
      and coalesce(u.signup_source->>'method', '') <> 'invite'`)
  const whatsapp = await getSetting<string | null>('contact.whatsapp', null)
  const replyTo = await getSetting<string | null>('contact.email', null)
  const base = env.APP_URL.replace(/\/$/, '')
  const host = env.APP_URL.replace(/^https?:\/\/app\./, '').replace(/\/.*$/, '')
  let sent = 0
  for (const r of rows) {
    const due = dueStep(r, now.getTime())
    if (!due) continue
    // Réservation d'abord : deux workers en parallèle n'envoient jamais le même email.
    const claimed = await db.insert(onboardingEmails).values({ userId: r.id, kind: due.kind, step: due.step }).onConflictDoNothing().returning({ id: onboardingEmails.id })
    if (!claimed.length) continue
    const mail = onboardingEmail(due.kind, due.step, {
      name: r.name,
      lang: langOf(r.signup_source, r.store_locale),
      appUrl: base,
      storeName: r.store_name,
      storeUrl: r.store_slug ? `https://${r.store_slug}.${host}` : null,
      unsubscribe: unsubscribeUrl(r.id),
      whatsapp,
    })
    await sendEmail(r.email, mail.subject, mail.html, { fromName: 'Zuri', ...(replyTo ? { replyTo } : {}) })
    sent++
  }
  return sent
}

export async function optOut(userId: number) {
  await db.update(users).set({ emailOptOutAt: new Date() }).where(dsql`${users.id} = ${userId} and ${users.emailOptOutAt} is null`)
}
