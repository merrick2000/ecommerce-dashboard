import { paymentProviderSchema } from '@zuri/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { stores } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { availableNetworks, confirmOtp, handleWebhook, initiatePayment, paymentStatus } from '../payments/service'
import { createPoSession, handlePoWebhook } from '../services/po'

const tokenParam = z.object({ token: z.string().min(20).max(64) })

export const paymentRoutes = new Hono<AppEnv>()
  .get('/stores/:slug/payment-networks', async (c) => {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, c.req.param('slug'))).limit(1)
    if (!store) throw notFound('Boutique')
    c.header('Cache-Control', 'public, max-age=60')
    return c.json(await availableNetworks(store.id))
  })
  .post(
    '/orders/:token/pay',
    rateLimit({ key: 'pay', limit: 10, windowSec: 600 }),
    v('param', tokenParam),
    v('json', z.object({ country: z.string().length(2).toUpperCase(), network: z.string().min(2).max(20).toLowerCase(), phone: z.string().trim().min(6).max(25) })),
    async (c) => c.json(await initiatePayment(c.req.valid('param').token, c.req.valid('json'))),
  )
  .post('/orders/:token/otp', rateLimit({ key: 'otp', limit: 10, windowSec: 600 }), v('param', tokenParam), v('json', z.object({ otp: z.string().trim().min(3).max(12) })), async (c) =>
    c.json(await confirmOtp(c.req.valid('param').token, c.req.valid('json').otp)),
  )
  .get('/orders/:token/payment-status', rateLimit({ key: 'pstatus', limit: 60, windowSec: 300 }), v('param', tokenParam), async (c) => {
    c.header('Cache-Control', 'no-store')
    return c.json(await paymentStatus(c.req.valid('param').token))
  })
  /** Payment Orchestrator : session de paiement (montant calculé côté serveur), à ouvrir avec le widget ou en redirection. */
  .post('/orders/:token/po-session', rateLimit({ key: 'po-session', limit: 20, windowSec: 600 }), v('param', tokenParam), async (c) => {
    c.header('Cache-Control', 'no-store')
    return c.json(await createPoSession(c.req.valid('param').token))
  })
  /**
   * Webhooks Payment Orchestrator (corps BRUT pour la signature) : URL propre à la boutique (recommandée,
   * affichée dans Paramètres > Paiements) ou URL globale (compte de la plateforme).
   */
  .post('/webhooks/payment-orchestrator/:webhookToken', async (c) => {
    const status = await handlePoWebhook(await c.req.text(), c.req.header('x-po-signature'), c.req.param('webhookToken'))
    return c.json({ received: status === 200 }, status as 200 | 400 | 500)
  })
  .post('/webhooks/payment-orchestrator', async (c) => {
    const status = await handlePoWebhook(await c.req.text(), c.req.header('x-po-signature'))
    return c.json({ received: status === 200 }, status as 200 | 400 | 500)
  })
  /** URL de webhook par compte : /webhooks/:provider/:webhookToken, répond toujours 200 (pas d'oracle). */
  .post('/webhooks/:provider/:webhookToken', v('param', z.object({ provider: paymentProviderSchema, webhookToken: z.string().min(16).max(64) })), async (c) => {
    const { provider, webhookToken } = c.req.valid('param')
    let payload: unknown = null
    const type = c.req.header('content-type') ?? ''
    try {
      payload = type.includes('application/json') ? await c.req.json() : Object.fromEntries((await c.req.formData()).entries())
    } catch {
      return c.text('OK')
    }
    try {
      await handleWebhook(provider, webhookToken, payload)
    } catch (e) {
      console.error(`[webhook ${provider}]`, e)
    }
    return c.text('OK')
  })
