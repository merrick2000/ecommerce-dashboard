/**
 * Routes publiques du site Zuri (sous /api/v1) : coordonnées de contact, formulaire de contact,
 * désinscription des emails d'accompagnement.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { contactMessages, sellerReviews, users } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { env } from '../lib/env'
import { clientIp, rateLimit } from '../lib/rate-limit'
import { escapeHtml } from '../lib/sanitize'
import { v } from '../lib/validate'
import { layout } from '../services/emails'
import { sendEmail } from '../services/notify'
import { checkUnsubscribe, optOut } from '../services/onboarding'
import { enqueue } from '../jobs/queue'
import { getSetting } from '../services/platform'

export const DEFAULT_CONTACT_EMAIL = 'contact@zurisell.store'

export async function contactInfo() {
  const [email, whatsapp, socials] = await Promise.all([getSetting<string | null>('contact.email', null), getSetting<string | null>('contact.whatsapp', null), getSetting<string[] | null>('social.links', null)])
  const { billingPromo } = await import('../services/billing')
  return { email: email || DEFAULT_CONTACT_EMAIL, whatsapp: whatsapp || null, socials: socials ?? [], promo: await billingPromo() }
}

const page = (title: string, text: string) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;padding:16px">
<main style="max-width:440px;background:#fff;border-radius:12px;padding:28px;text-align:center"><h1 style="font-size:20px;margin:0 0 8px">${escapeHtml(title)}</h1><p style="margin:0;color:#52525b;line-height:1.6">${text}</p></main></body></html>`

export const siteRoutes = new Hono<AppEnv>()
  /** Témoignages de vendeurs publiés (accord du vendeur et validation du super admin). */
  .get('/platform/testimonials', async (c) => {
    const rows = await db
      .select({ name: sellerReviews.publishName, role: sellerReviews.publishRole, comment: sellerReviews.comment, score: sellerReviews.score, storeUrl: sellerReviews.storeUrl, date: sellerReviews.updatedAt })
      .from(sellerReviews)
      .where(eq(sellerReviews.status, 'approved'))
      .orderBy(desc(sellerReviews.updatedAt))
      .limit(24)
    c.header('Cache-Control', 'public, max-age=300')
    return c.json(rows)
  })
  .get('/platform/contact', async (c) => {
    c.header('Cache-Control', 'public, max-age=300')
    return c.json(await contactInfo())
  })
  .post(
    '/contact',
    rateLimit({ key: 'contact', limit: 5, windowSec: 900 }),
    v(
      'json',
      z.object({
        name: z.string().trim().min(2, 'Indiquez votre nom').max(120),
        email: z.string().trim().toLowerCase().email('Email invalide').max(255),
        phone: z.string().trim().max(40).optional(),
        message: z.string().trim().min(10, 'Votre message est trop court').max(5000),
        page: z.string().max(200).optional(),
        lang: z.enum(['fr', 'en']).optional(),
        /** Champ piège invisible : rempli seulement par les robots. */
        website: z.string().max(200).optional(),
      }),
    ),
    async (c) => {
      const b = c.req.valid('json')
      if (b.website) return c.json({ ok: true })
      await db.insert(contactMessages).values({ name: b.name, email: b.email, phone: b.phone || null, message: b.message, page: b.page ?? null, lang: b.lang ?? 'fr', ip: clientIp((n) => c.req.header(n)).slice(0, 64) })
      const { email } = await contactInfo()
      const admin = `${env.APP_URL.replace(/\/$/, '')}/admin/messages`
      await sendEmail(
        email,
        `Nouveau message de ${b.name}`,
        layout(
          'Zuri',
          `<p><strong>${escapeHtml(b.name)}</strong> (${escapeHtml(b.email)}${b.phone ? `, ${escapeHtml(b.phone)}` : ''}) a écrit depuis ${escapeHtml(b.page ?? 'le site')} :</p>
<p style="white-space:pre-wrap;background:#f4f4f5;border-radius:8px;padding:12px 16px">${escapeHtml(b.message)}</p>
<p>Répondez directement à cet email, ou retrouvez le message dans le <a href="${escapeHtml(admin)}">super admin</a>.</p>`,
        ),
        { fromName: 'Zuri contact', replyTo: b.email },
      ).catch((e) => console.warn('[contact] email', (e as Error).message))
      await enqueue('admin.notify', { title: `Nouveau message de ${b.name}`, body: b.message.slice(0, 140), path: '/admin/messages', tag: 'contact' })
      return c.json({ ok: true }, 201)
    },
  )
  /**
   * GentleMail : chaque email reçu sur une boîte (ex. contact@zurisell.store) arrive dans l'onglet Messages
   * du super admin. Signature HMAC-SHA256 vérifiée sur le corps brut, horodatage à 5 minutes près, un seul
   * enregistrement par message.
   */
  .post('/webhooks/gentlemail', async (c) => {
    const secret = env.GENTLEMAIL_WEBHOOK_SECRET
    if (!secret) return c.json({ error: 'Non configuré', code: 'not_configured' }, 404)
    const raw = await c.req.text()
    const ts = c.req.header('x-gentlemail-timestamp') ?? ''
    const sig = (c.req.header('x-gentlemail-signature') ?? '').replace(/^v1=/, '')
    if (!/^\d+$/.test(ts) || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return c.json({ error: 'Horodatage invalide' }, 401)
    const expected = createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return c.json({ error: 'Signature invalide' }, 401)
    let event: { event?: string; data?: { id?: string; mailbox?: { address?: string }; from?: { name?: string | null; address?: string }; subject?: string | null; text?: string | null } }
    try {
      event = JSON.parse(raw)
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const m = event.data
    if (event.event !== 'message.received' || !m?.id || !m.from?.address) return c.json({ ok: true, ignored: true })
    // Nos propres envois (alerte du formulaire de contact, relances) : déjà dans Messages, on ne les double pas.
    const own = (env.MAIL_FROM.match(/<([^>]+)>/)?.[1] ?? env.MAIL_FROM).trim().toLowerCase()
    if (m.from.address.toLowerCase() === own) return c.json({ ok: true, ignored: true })
    const body = [m.subject ? `Objet : ${m.subject}` : null, (m.text ?? '').trim()].filter(Boolean).join('\n\n').slice(0, 5000) || '(message vide)'
    const inserted = await db
      .insert(contactMessages)
      .values({ name: (m.from.name || m.from.address).slice(0, 120), email: m.from.address.toLowerCase().slice(0, 255), message: body, page: `email : ${m.mailbox?.address ?? ''}`.slice(0, 200), source: 'email', externalId: m.id.slice(0, 80) })
      .onConflictDoNothing()
      .returning({ id: contactMessages.id })
    if (inserted.length) await enqueue('admin.notify', { title: `Email de ${m.from.name || m.from.address}`, body: (m.subject || body).slice(0, 140), path: '/admin/messages', tag: 'contact' })
    return c.json({ ok: true })
  })
  /** « Qu'est-ce qui vous bloque ? » : réponse en un clic depuis l'email (lien signé), aide adaptée, champ libre. */
  .get('/feedback/blocker', v('query', z.object({ u: z.coerce.number().int().positive(), a: z.string().max(30), t: z.string().max(64) })), async (c) => {
    const { u, a, t } = c.req.valid('query')
    const { BLOCKERS, blockerHelp, checkBlocker, recordBlocker } = await import('../services/activation')
    if (!(a in BLOCKERS) || !checkBlocker(u, a, t)) return c.html(page('Lien invalide', 'Ce lien n’est plus valable.'), 400)
    const [usr] = await db.select({ id: users.id, signupSource: users.signupSource }).from(users).where(eq(users.id, u)).limit(1)
    if (!usr) return c.html(page('Lien invalide', 'Ce lien n’est plus valable.'), 400)
    await recordBlocker(u, a as never, 'email')
    const lang = usr.signupSource?.lang === 'en' || /^\/en(\/|$)/.test(usr.signupSource?.from ?? '') ? 'en' : 'fr'
    const app = env.APP_URL.replace(/\/$/, '')
    const form = `<form method="post" action="/api/v1/feedback/blocker" style="margin-top:16px;text-align:left"><input type="hidden" name="u" value="${u}"><input type="hidden" name="a" value="${escapeHtml(a)}"><input type="hidden" name="t" value="${escapeHtml(t)}"><textarea name="detail" rows="3" maxlength="1000" placeholder="${lang === 'en' ? 'Tell us more (optional)' : 'Dites-nous en plus (facultatif)'}" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d4d4d8;border-radius:10px;font:inherit"></textarea><button style="margin-top:8px;padding:10px 16px;border:0;border-radius:10px;background:#18181b;color:#fff;font:inherit;cursor:pointer">${lang === 'en' ? 'Send' : 'Envoyer'}</button></form>`
    const cta = `<p style="margin-top:16px"><a href="${app}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#f59e0b;color:#18181b;font-weight:600;text-decoration:none">${lang === 'en' ? 'Add my first product' : 'Ajouter mon premier produit'}</a></p>`
    return c.html(page(lang === 'en' ? 'Thank you, noted' : 'Merci, c’est noté', `${escapeHtml(blockerHelp(a as never, lang))}${cta}${form}`))
  })
  .post('/feedback/blocker', rateLimit({ key: 'blocker-detail', limit: 10, windowSec: 600 }), async (c) => {
    const f = await c.req.parseBody()
    const u = Number(f.u)
    const a = String(f.a ?? '')
    const t = String(f.t ?? '')
    const detail = String(f.detail ?? '').trim().slice(0, 1000)
    const { BLOCKERS, checkBlocker, recordBlocker } = await import('../services/activation')
    if (!Number.isInteger(u) || !(a in BLOCKERS) || !checkBlocker(u, a, t)) return c.html(page('Lien invalide', 'Ce lien n’est plus valable.'), 400)
    if (detail) await recordBlocker(u, a as never, 'email', detail)
    return c.html(page('Merci', 'Votre message est bien arrivé. On vous répond très vite.'))
  })
  .get('/unsubscribe', v('query', z.object({ u: z.coerce.number().int().positive(), t: z.string().max(64) })), async (c) => {
    const { u, t } = c.req.valid('query')
    if (!checkUnsubscribe(u, t)) return c.html(page('Lien invalide', 'Ce lien de désinscription n’est pas valide.'), 400)
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, u)).limit(1)
    if (user) await optOut(u)
    return c.html(page('C’est noté', 'Vous ne recevrez plus nos conseils de démarrage. Les emails liés à votre compte et à vos commandes continuent d’arriver.<br><br>You will no longer receive our getting-started tips.'))
  })
