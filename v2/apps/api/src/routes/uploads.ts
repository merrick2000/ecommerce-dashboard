import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { badRequest } from '../lib/errors'
import { v } from '../lib/validate'
import { privateKey, putObject } from '../services/storage'
import { importRemoteImage, storeImage } from '../services/remote'
import { publicUrl } from '../services/storage'
import { rateLimit } from '../lib/rate-limit'

const MAX_IMAGE = 15 * 1024 * 1024
const MAX_FILE = 500 * 1024 * 1024


export const uploadRoutes = new Hono<AppEnv>()
  .use(requirePermission('products.edit'))
  /** Image → WebP redimensionnée, stockée en public. */
  .post('/image', v('query', z.object({ preset: z.enum(['cover', 'thumbnail', 'content', 'gallery']).default('content') })), async (c) => {
    const form = await c.req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('Fichier manquant')
    if (file.size > MAX_IMAGE) throw badRequest('Image trop lourde (15 Mo max)')
    return c.json(await storeImage(c.get('store').id, Buffer.from(await file.arrayBuffer()), c.req.valid('query').preset))
  })
  /** Image depuis un lien public (outil MCP, imports) : téléchargée, contrôlée (anti-SSRF), convertie en WebP. */
  .post(
    '/image-url',
    rateLimit({ key: 'image-url', limit: 60, windowSec: 600 }),
    v('json', z.object({ url: z.string().trim().url().max(2000), preset: z.enum(['cover', 'thumbnail', 'content', 'gallery']).default('content') })),
    async (c) => {
      const { url, preset } = c.req.valid('json')
      try {
        const key = await importRemoteImage(c.get('store').id, url, preset)
        return c.json({ key, url: publicUrl(key) })
      } catch (err) {
        throw badRequest(`Image non importée : ${(err as Error).message}`)
      }
    },
  )
  /** Fichier digital à vendre → stockage privé (servi par URL signée après paiement). */
  .post('/file', requirePermission('products.edit'), async (c) => {
    const form = await c.req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('Fichier manquant')
    if (file.size > MAX_FILE) throw badRequest('Fichier trop lourd (500 Mo max)')
    const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-120)
    const key = privateKey(c.get('store').id, `${crypto.randomUUID()}-${safeName}`)
    await putObject(key, file, file.type || 'application/octet-stream', 'private')
    return c.json({ key, name: file.name, size: file.size })
  })
