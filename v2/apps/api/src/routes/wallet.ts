/**
 * Portefeuille de la boutique (produits digitaux encaissés par Zuri) : soldes, historique, demandes de retrait.
 * Réservé au propriétaire et aux personnes qui gèrent les paiements.
 */
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { contactMessages } from '../db/schema'
import { enqueue } from '../jobs/queue'
import { env } from '../lib/env'
import { rateLimit } from '../lib/rate-limit'
import { escapeHtml } from '../lib/sanitize'
import { layout } from '../services/emails'
import { sendEmail } from '../services/notify'
import { contactInfo } from './site'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { v } from '../lib/validate'
import { logActivity } from '../services/activity'
import { closeWithdrawal, commissionFor, requestWithdrawal, walletBalances, walletConfig, walletHistory } from '../services/wallet'

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive().max(100_000_000),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Numéro invalide'),
  network: z.string().trim().min(2).max(40),
  country: z.string().length(2).toUpperCase(),
  holderName: z.string().trim().max(120).optional(),
})

export const walletRoutes = new Hono<AppEnv>()
  .use(requirePermission('payments.manage'))
  .get('/', async (c) => {
    const store = c.get('store')
    const cfg = await walletConfig()
    if (!store.walletEnabled) {
      const [req] = await db.select({ at: contactMessages.createdAt }).from(contactMessages).where(eq(contactMessages.page, `wallet:${store.id}`)).orderBy(desc(contactMessages.createdAt)).limit(1)
      return c.json({ enabled: false, currency: store.currency, requestedAt: req?.at ?? null })
    }
    const [balances, history, commission] = await Promise.all([walletBalances(store.id), walletHistory(store.id), commissionFor(store)])
    return c.json({
      enabled: true,
      currency: store.currency,
      ...balances,
      commissionPct: commission.pct,
      holdDays: cfg.holdDays,
      minWithdrawal: cfg.minWithdrawal,
      payoutTo: store.walletPayoutTo ?? null,
      ...history,
    })
  })
  /** Demande d'ouverture du portefeuille : arrive dans les Messages du super admin (et par email), sans ouvrir de messagerie. */
  .post('/activation-request', rateLimit({ key: 'wallet-activation', limit: 3, windowSec: 3600 }), v('json', z.object({ note: z.string().trim().max(1000).optional() })), async (c) => {
    const store = c.get('store')
    const user = c.get('user')
    if (store.walletEnabled) return c.json({ ok: true, already: true })
    const key = `wallet:${store.id}`
    const [open] = await db.select({ id: contactMessages.id }).from(contactMessages).where(and(eq(contactMessages.page, key), eq(contactMessages.status, 'new'))).limit(1)
    if (open) return c.json({ ok: true, already: true })
    const { note } = c.req.valid('json')
    const admin = `${env.APP_URL.replace(/\/$/, '')}/admin/stores`
    const message = `Demande d’activation du portefeuille Zuri.\nBoutique : ${store.name} (${store.slug}, ${store.id}), ${store.kind === 'digital' ? 'produits digitaux' : 'produits physiques'}, pays ${store.country}.${note ? `\n\nMessage du vendeur :\n${note}` : ''}\n\nPour l’ouvrir : Super admin, Boutiques, colonne Portefeuille.`
    await db.insert(contactMessages).values({ name: user.name || store.name, email: user.email, message, page: key, lang: store.locale === 'en' ? 'en' : 'fr' })
    const { email } = await contactInfo()
    await sendEmail(
      email,
      `Portefeuille : demande d’activation de ${store.name}`,
      layout('Zuri', `<p><strong>${escapeHtml(user.name || user.email)}</strong> (${escapeHtml(user.email)}) demande l’activation du portefeuille pour <strong>${escapeHtml(store.name)}</strong>.</p>${note ? `<p style="white-space:pre-wrap;background:#f4f4f5;border-radius:8px;padding:12px 16px">${escapeHtml(note)}</p>` : ''}<p><a href="${escapeHtml(admin)}">Ouvrir le portefeuille dans le super admin</a></p>`),
      { fromName: 'Zuri', replyTo: user.email },
    ).catch((e) => console.warn('[wallet] email', (e as Error).message))
    await enqueue('admin.notify', { title: `Portefeuille : ${store.name}`, body: 'Demande d’activation du portefeuille', path: '/admin/messages', tag: `wallet-${store.id}` })
    return c.json({ ok: true, already: false }, 201)
  })
  .post('/withdrawals', v('json', withdrawalSchema), async (c) => {
    const store = c.get('store')
    const user = c.get('user')
    const w = await requestWithdrawal(store, user.id, c.req.valid('json'))
    await logActivity(c, { entityType: 'store', entityId: store.id, entityLabel: store.name, action: 'withdrawal_requested', message: `Retrait demandé : ${w.amount} ${w.currency} vers ${w.network} ${w.phone}` }).catch(() => undefined)
    return c.json(w, 201)
  })
  .post('/withdrawals/:wid/cancel', v('param', z.object({ wid: z.coerce.number().int().positive() })), async (c) => {
    const store = c.get('store')
    const w = await closeWithdrawal(c.req.valid('param').wid, 'cancelled', { userId: c.get('user').id, storeId: store.id })
    return c.json(w)
  })
