/**
 * Relance des abonnements abandonnés : le vendeur a ouvert le paiement de sa formule sans le terminer
 * (page de paiement fermée, paiement refusé ou jamais validé). Deux rappels, par email et sur le téléphone :
 * 1 h puis 24 h après la tentative. Jamais si un paiement a réussi depuis, jamais deux fois la même étape,
 * en journée seulement, désinscription respectée.
 * Une tentative qui n'a même pas pu démarrer (erreur de configuration côté Zuri) ne déclenche aucune relance.
 */
import { LAUNCH, PLANS, type PlanId } from '@zuri/shared'
import { sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { onboardingEmails } from '../db/schema'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { button, layout, small } from './emails'
import { sendPushToUser } from './notifications'
import { sendEmail } from './notify'
import { langOf, unsubscribeUrl } from './onboarding'
import { getSetting, resolveFeatures } from './platform'

const HOUR = 3600_000
/** Délai de chaque rappel après la tentative. */
export const BILLING_DELAYS = [1 * HOUR, 24 * HOUR]
/** Au-delà, la tentative est trop ancienne pour être relancée. */
const MAX_AGE = 4 * 24 * HOUR

type Attempt = {
  user_id: number
  email: string
  name: string
  signup_source: { from?: string; landing?: string; lang?: string } | null
  is_platform_admin: boolean
  features: Record<string, boolean> | null
  store_locale: string | null
  attempt_id: number
  plan: Exclude<PlanId, 'free'>
  months: number
  amount: number
  created_at: Date | string
  sent_steps: number[] | null
}

/** Étape à envoyer pour cette tentative, ou null. */
export function dueBillingStep(createdAt: Date, sentSteps: number[], now = Date.now()): number | null {
  const age = now - createdAt.getTime()
  if (age > MAX_AGE) return null
  for (let i = BILLING_DELAYS.length - 1; i >= 0; i--) {
    const step = i + 1
    if (age >= BILLING_DELAYS[i]!) return sentSteps.includes(step) ? null : step
  }
  return null
}

function billingReminder(step: number, c: { lang: 'fr' | 'en'; name: string; plan: string; months: number; amount: number; link: string; whatsapp: string | null; unsubscribe: string }) {
  const en = c.lang === 'en'
  const first = escapeHtml(c.name.split(/\s+/)[0] ?? '')
  const price = `${c.amount.toLocaleString('fr-FR')} FCFA`
  const period = c.months === 12 ? (en ? '12 months' : '12 mois') : en ? '1 month' : '1 mois'
  const launchEnd = new Date(LAUNCH.unlimitedUntil)
  const launchSoon = launchEnd.getTime() > Date.now()
  const endLabel = launchEnd.toLocaleDateString(en ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' })
  const help = c.whatsapp
    ? en
      ? `<p>Payment refused or a question? Write to us on WhatsApp (${escapeHtml(c.whatsapp)}), we will sort it out with you.</p>`
      : `<p>Paiement refusé ou une question ? Écrivez-nous sur WhatsApp (${escapeHtml(c.whatsapp)}), on règle ça avec vous.</p>`
    : en
      ? '<p>Payment refused or a question? Just reply to this email.</p>'
      : '<p>Paiement refusé ou une question ? Répondez simplement à cet email.</p>'
  const subject =
    step === 1
      ? en
        ? `Your Zuri ${c.plan} plan is waiting for you`
        : `Votre formule Zuri ${c.plan} vous attend`
      : en
        ? `Last reminder: activate Zuri ${c.plan}`
        : `Dernier rappel : activez Zuri ${c.plan}`
  const body =
    step === 1
      ? en
        ? `<p>You started paying for <strong>Zuri ${c.plan}</strong> (${period}, ${price}) but the payment did not go through. It happens: closed page, network, or balance.</p><p>You can finish in one minute, with Mobile Money or card.</p>`
        : `<p>Vous avez commencé à payer <strong>Zuri ${c.plan}</strong> (${period}, ${price}), mais le paiement n’est pas allé au bout. Ça arrive : page fermée, réseau ou solde.</p><p>Vous pouvez terminer en une minute, par Mobile Money ou carte.</p>`
      : en
        ? `<p>Your <strong>Zuri ${c.plan}</strong> payment (${period}, ${price}) is still not completed.${launchSoon ? ` The free launch offer ends on ${endLabel}: choose your plan now to keep all your features without interruption.` : ''}</p><p>If it did not work with one number or network, try another one.</p>`
        : `<p>Le paiement de <strong>Zuri ${c.plan}</strong> (${period}, ${price}) n’est toujours pas terminé.${launchSoon ? ` L’offre de lancement gratuite se termine le ${endLabel} : choisissez votre formule maintenant pour garder toutes vos fonctions sans coupure.` : ''}</p><p>Si ça n’a pas marché avec un numéro ou un réseau, essayez-en un autre.</p>`
  const html = layout(
    'Zuri',
    `<p>${en ? 'Hi' : 'Bonjour'} ${first},</p>${body}${button(c.link, en ? 'Finish my payment' : 'Terminer mon paiement')}${help}${small(`${en ? 'No more emails like this?' : 'Ne plus recevoir ces emails ?'} <a href="${c.unsubscribe}">${en ? 'Unsubscribe' : 'Se désinscrire'}</a>`)}`,
    '#f59e0b',
    c.lang,
  )
  return { subject, html, push: en ? `Your ${c.plan} payment is not completed. Finish it in one minute.` : `Votre paiement ${c.plan} n’est pas terminé. Finissez-le en une minute.` }
}

export async function runBillingRecovery(now = new Date()): Promise<number> {
  const h = now.getUTCHours()
  if (h < 6 || h >= 20) return 0
  // Dernière tentative de chaque compte, ouverte chez le prestataire (provider_ref), sans paiement réussi depuis.
  const rows = await db.execute<Attempt>(dsql`
    select distinct on (u.id) u.id as user_id, u.email, u.name, u.signup_source, u.is_platform_admin, u.features,
      (select s.locale from stores s join store_members m on m.store_id = s.id and m.role = 'owner' where m.user_id = u.id order by s.created_at limit 1) as store_locale,
      b.id as attempt_id, b.plan, b.months, b.amount, b.created_at,
      (select array_agg(e.step) from onboarding_emails e where e.user_id = u.id and e.kind = 'billing_' || b.id) as sent_steps
    from billing_payments b join users u on u.id = b.user_id
    where b.status in ('pending', 'failed') and b.provider_ref is not null
      and b.created_at >= ${now.toISOString()}::timestamptz - interval '4 days'
      and u.disabled_at is null and u.email_opt_out_at is null and u.is_platform_admin = false
      and not exists (select 1 from billing_payments p where p.user_id = u.id and p.status = 'paid' and p.created_at >= b.created_at)
    order by u.id, b.created_at desc`)
  if (!rows.length) return 0
  const whatsapp = await getSetting<string | null>('contact.whatsapp', null)
  const replyTo = await getSetting<string | null>('contact.email', null)
  const app = env.APP_URL.replace(/\/$/, '')
  let sent = 0
  for (const r of rows) {
    const step = dueBillingStep(new Date(r.created_at), r.sent_steps ?? [], now.getTime())
    if (!step) continue
    // Paiement des abonnements refermé pour ce compte entre-temps : il ne pourrait pas payer.
    if (!(await resolveFeatures({ isPlatformAdmin: r.is_platform_admin, features: r.features as never })).billing) continue
    const claimed = await db.insert(onboardingEmails).values({ userId: r.user_id, kind: `billing_${r.attempt_id}`, step }).onConflictDoNothing().returning({ id: onboardingEmails.id })
    if (!claimed.length) continue
    const link = `${app}/billing?plan=${r.plan}&months=${r.months}`
    const mail = billingReminder(step, {
      lang: langOf(r.signup_source, r.store_locale),
      name: r.name,
      plan: PLANS[r.plan]?.name ?? r.plan,
      months: r.months,
      amount: r.amount,
      link,
      whatsapp,
      unsubscribe: unsubscribeUrl(r.user_id),
    })
    await sendEmail(r.email, mail.subject, mail.html, { fromName: 'Zuri', ...(replyTo ? { replyTo } : {}) }).catch(() => undefined)
    await sendPushToUser(r.user_id, { title: mail.subject, body: mail.push, url: link, tag: `billing-${r.attempt_id}`, event: 'platform', sound: 'soft' }).catch(() => 0)
    sent++
  }
  return sent
}
