/**
 * Rédaction IA d'un produit (sous /stores/:storeId/products/ai), utilisée par l'import par lien et par l'éditeur :
 * - réécriture structurée de la description (PASA ou AIDA) ;
 * - régénération d'une image de la description (tâche asynchrone : lancement puis suivi).
 * Coûteux : ouvert avec l'import par lien (super admin), et seulement si kie.ai est configuré.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { aiAvailable } from '../services/ai-suggest'
import { imageRegenerationStatus, rewriteDescription, startImageRegeneration } from '../services/ai-description'
import { resolveFeatures } from '../services/platform'
import { assertPublicUrl } from '../services/remote'

export const productAiRoutes = new Hono<AppEnv>()
  .use(requirePermission('products.edit'))
  .get('/config', async (c) => {
    const enabled = (await resolveFeatures(c.get('user'))).urlImport && aiAvailable()
    return c.json({ rewrite: enabled, images: enabled })
  })
  .use(async (c, next) => {
    if (!(await resolveFeatures(c.get('user'))).urlImport) throw new HttpError(403, 'La rédaction IA n’est pas encore ouverte sur ton compte.', 'ai_disabled')
    if (!aiAvailable()) throw new HttpError(404, 'Rédaction IA non configurée', 'ai_unavailable')
    await next()
  })
  .post(
    '/rewrite-description',
    rateLimit({ key: 'ai-rewrite', limit: 20, windowSec: 600 }),
    v(
      'json',
      z.object({
        name: z.string().trim().max(160).default(''),
        description: z.string().max(200_000),
        features: z.array(z.string().max(200)).max(30).default([]),
        price: z.coerce.number().min(0).nullable().optional(),
        goal: z.string().max(300).optional(),
        /** Type du produit édité (à défaut, celui de la boutique). */
        type: z.enum(['physical', 'digital']).optional(),
      }),
    ),
    async (c) => {
      const store = c.get('store')
      const { type, ...body } = c.req.valid('json')
      return c.json(await rewriteDescription({ ...body, price: body.price ?? null, currency: store.currency, kind: type ?? (store.kind === 'digital' ? 'digital' : 'physical') }))
    },
  )
  .post(
    '/images/regenerate',
    rateLimit({ key: 'ai-image', limit: 20, windowSec: 600 }),
    v('json', z.object({ imageUrl: z.string().url().max(2000), name: z.string().trim().max(160).default(''), context: z.string().max(400).optional(), instruction: z.string().max(300).optional(), type: z.enum(['physical', 'digital']).optional() })),
    async (c) => {
      const { type, ...body } = c.req.valid('json')
      // Le fournisseur va lire cette adresse : jamais une adresse interne.
      await assertPublicUrl(body.imageUrl)
      return c.json({ taskId: await startImageRegeneration(c.get('store').id, { ...body, kind: type ?? (c.get('store').kind === 'digital' ? 'digital' : 'physical') }) }, 202)
    },
  )
  .get('/images/regenerate/:taskId', async (c) => c.json(await imageRegenerationStatus(c.get('store').id, c.req.param('taskId').slice(0, 100))))
