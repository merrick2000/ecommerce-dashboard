import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { authRoutes } from './routes/auth'
import { integrationRoutes } from './routes/integrations'
import { invitationRoutes } from './routes/invitations'
import { notificationRoutes, telegramWebhookRoutes } from './routes/notifications'
import { paymentRoutes } from './routes/payments'
import { publicRoutes } from './routes/public'
import { siteRoutes } from './routes/site'
import { reviewRoutes } from './routes/reviews'
import { referralRoutes } from './routes/referrals'
import { announcementRoutes } from './routes/announcements'
import { storeRoutes } from './routes/stores'
import { adminRoutes } from './routes/admin'
import { billingRoutes } from './routes/billing'
import { apiKeyRoutes } from './routes/api-keys'
import { mcpRoutes } from './routes/mcp'
import type { AppEnv } from './lib/context'
import { HttpError } from './lib/errors'
import { ValidationError } from './lib/validate'
import { env, isProd } from './lib/env'
import { safeEqual } from './lib/crypto'
import { sql } from './db/client'

export const app = new Hono<AppEnv>()

if (!isProd && process.env.NODE_ENV !== 'test') app.use(logger())

/** Production : journal des écritures, des erreurs et des requêtes lentes (visible dans les logs Dokploy). */
if (isProd) {
  app.use('/api/*', async (c, next) => {
    const start = performance.now()
    await next()
    const ms = Math.round(performance.now() - start)
    const status = c.res.status
    if (status >= 500 || ms > 2000 || (c.req.method !== 'GET' && c.req.method !== 'HEAD')) {
      console.log(`[http] ${c.req.method} ${c.req.path} ${status} ${ms}ms`)
    }
  })
}
app.use(secureHeaders())

// Derrière le Worker : seules les requêtes portant le secret partagé sont acceptées.
if (env.EDGE_SECRET) {
  const secret = env.EDGE_SECRET
  app.use('/api/*', async (c, next) => {
    if (c.req.path === '/api/health') return next()
    if (!safeEqual(c.req.header('x-edge-secret') ?? '', secret)) return c.json({ error: 'Accès direct interdit', code: 'edge_only' }, 403)
    await next()
  })
}

app.get('/api/health', async (c) => {
  await sql`select 1`
  return c.json({ ok: true })
})

const api = new Hono<AppEnv>().route('/auth', authRoutes).route('/stores', storeRoutes).route('/admin', adminRoutes).route('/reviews', reviewRoutes).route('/referrals', referralRoutes).route('/announcements', announcementRoutes).route('/billing', billingRoutes).route('/invitations', invitationRoutes).route('/notifications', notificationRoutes).route('/api-keys', apiKeyRoutes).route('/mcp', mcpRoutes).route('/v1', publicRoutes).route('/v1', siteRoutes).route('/v1', paymentRoutes).route('/v1', integrationRoutes).route('/v1', telegramWebhookRoutes)
app.route('/api', api)

app.notFound((c) => c.json({ error: 'Route introuvable', code: 'not_found' }, 404))

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message, code: err.code, issues: err.issues }, 422)
  if (err instanceof HttpError) return c.json({ error: err.message, code: err.code }, err.status)
  // Violation d'unicité Postgres non anticipée → 409 plutôt que 500.
  if ((err as { code?: string }).code === '23505') return c.json({ error: 'Cette valeur existe déjà', code: 'conflict' }, 409)
  console.error(err)
  return c.json({ error: 'Erreur interne', code: 'internal' }, 500)
})

export type AppType = typeof api
