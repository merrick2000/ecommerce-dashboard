import { createMiddleware } from 'hono/factory'
import { HttpError } from './errors'

/**
 * Limiteur en mémoire (fenêtre fixe), suffisant pour une instance.
 * Derrière le Worker Cloudflare, l'IP réelle vient de CF-Connecting-IP.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
}, 60_000).unref?.()

export function clientIp(header: (name: string) => string | undefined): string {
  return header('cf-connecting-ip') ?? header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
}

export const rateLimit = (opts: { key: string; limit: number; windowSec: number }) =>
  createMiddleware(async (c, next) => {
    if (process.env.NODE_ENV === 'test') return next()
    const id = `${opts.key}:${clientIp((n) => c.req.header(n))}`
    const now = Date.now()
    let b = buckets.get(id)
    if (!b || b.resetAt < now) {
      b = { count: 0, resetAt: now + opts.windowSec * 1000 }
      buckets.set(id, b)
    }
    b.count++
    if (b.count > opts.limit) {
      c.header('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)))
      throw new HttpError(429, 'Trop de tentatives, réessayez plus tard', 'rate_limited')
    }
    await next()
  })
