import { Hono } from 'hono'
import sharp from 'sharp'
import { z } from 'zod'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { badRequest } from '../lib/errors'
import { v } from '../lib/validate'
import { privateKey, publicUrl, putObject } from '../services/storage'

const MAX_IMAGE = 15 * 1024 * 1024
const MAX_FILE = 500 * 1024 * 1024

const PRESETS = {
  cover: { width: 1280, quality: 80 },
  thumbnail: { width: 600, quality: 80 },
  content: { width: 1200, quality: 78 },
  gallery: { width: 1280, quality: 80 },
} as const

export const uploadRoutes = new Hono<AppEnv>()
  .use(requireRole('staff'))
  /** Image → WebP redimensionnée, stockée en public. */
  .post('/image', v('query', z.object({ preset: z.enum(['cover', 'thumbnail', 'content', 'gallery']).default('content') })), async (c) => {
    const form = await c.req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('Fichier manquant')
    if (file.size > MAX_IMAGE) throw badRequest('Image trop lourde (15 Mo max)')
    const preset = PRESETS[c.req.valid('query').preset]
    let out: Buffer
    try {
      out = await sharp(Buffer.from(await file.arrayBuffer()), { animated: false })
        .rotate() // respecte l'orientation EXIF des photos de téléphone
        .resize({ width: preset.width, withoutEnlargement: true })
        .webp({ quality: preset.quality })
        .toBuffer()
    } catch {
      throw badRequest('Format d’image non supporté')
    }
    const key = `stores/${c.get('store').id}/images/${crypto.randomUUID()}.webp`
    await putObject(key, out, 'image/webp', 'public-read')
    return c.json({ key, url: publicUrl(key), size: out.length })
  })
  /** Fichier digital à vendre → stockage privé (servi par URL signée après paiement). */
  .post('/file', requireRole('admin'), async (c) => {
    const form = await c.req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('Fichier manquant')
    if (file.size > MAX_FILE) throw badRequest('Fichier trop lourd (500 Mo max)')
    const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-120)
    const key = privateKey(c.get('store').id, `${crypto.randomUUID()}-${safeName}`)
    await putObject(key, file, file.type || 'application/octet-stream', 'private')
    return c.json({ key, name: file.name, size: file.size })
  })
