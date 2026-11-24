/**
 * Routes publiques du site Zuri (sous /api/v1) : coordonnées de contact, formulaire de contact,
 * désinscription des emails d'accompagnement.
 */
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { contactMessages, users } from '../db/schema'
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
  const [email, whatsapp] = await Promise.all([getSetting<string | null>('contact.email', null), getSetting<string | null>('contact.whatsapp', null)])
  return { email: email || DEFAULT_CONTACT_EMAIL, whatsapp: whatsapp || null }
}

const page = (title: string, text: string) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;padding:16px">
<main style="max-width:440px;background:#fff;border-radius:12px;padding:28px;text-align:center"><h1 style="font-size:20px;margin:0 0 8px">${escapeHtml(title)}</h1><p style="margin:0;color:#52525b;line-height:1.6">${text}</p></main></body></html>`

export const siteRoutes = new Hono<AppEnv>()
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
  .get('/unsubscribe', v('query', z.object({ u: z.coerce.number().int().positive(), t: z.string().max(64) })), async (c) => {
    const { u, t } = c.req.valid('query')
    if (!checkUnsubscribe(u, t)) return c.html(page('Lien invalide', 'Ce lien de désinscription n’est pas valide.'), 400)
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, u)).limit(1)
    if (user) await optOut(u)
    return c.html(page('C’est noté', 'Vous ne recevrez plus nos conseils de démarrage. Les emails liés à votre compte et à vos commandes continuent d’arriver.<br><br>You will no longer receive our getting-started tips.'))
  })
