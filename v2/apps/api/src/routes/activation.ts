/** Démarrage du vendeur connecté (sous /api/seller) : étapes du tableau de bord et « qu'est-ce qui vous bloque ? ». */
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { BLOCKER_IDS, logSellerEvent, myLastBlocker, recordBlocker } from '../services/activation'

export const activationRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post(
    '/events',
    rateLimit({ key: 'seller-events', limit: 60, windowSec: 600 }),
    v('json', z.object({ type: z.enum(['product_editor_open', 'product_import_open', 'product_save_error']), storeId: z.string().max(40).optional(), data: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean(), z.array(z.string().max(80)).max(20)])).optional() })),
    async (c) => {
      const b = c.req.valid('json')
      await logSellerEvent(c.get('user').id, b.type, b.storeId, b.data)
      return c.json({ ok: true })
    },
  )
  .get('/blocker', async (c) => c.json(await myLastBlocker(c.get('user').id)))
  .post('/blocker', rateLimit({ key: 'seller-blocker', limit: 10, windowSec: 600 }), v('json', z.object({ answer: z.enum(BLOCKER_IDS as [string, ...string[]]), detail: z.string().max(1000).optional() })), async (c) => {
    const b = c.req.valid('json')
    await recordBlocker(c.get('user').id, b.answer as never, 'dashboard', b.detail)
    return c.json({ ok: true })
  })
