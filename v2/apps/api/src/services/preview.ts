/**
 * Lien d'aperçu d'un produit (actif ou non) : jeton signé, valable quelques heures, propre au produit.
 * Ouvert depuis l'édition du produit ; la page n'est ni indexée, ni mise en cache, ni comptée dans les stats.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../lib/env'

const TTL_SECONDS = 6 * 3600
const sign = (productId: string, exp: number) => createHmac('sha256', Buffer.from(env.APP_KEY, 'base64')).update(`preview:${productId}:${exp}`).digest('base64url').slice(0, 32)

export function previewToken(productId: string, now = Date.now()): { token: string; expiresAt: string } {
  const exp = Math.floor(now / 1000) + TTL_SECONDS
  return { token: `${exp}.${sign(productId, exp)}`, expiresAt: new Date(exp * 1000).toISOString() }
}

export function checkPreviewToken(productId: string, token: string | undefined | null, now = Date.now()): boolean {
  if (!token) return false
  const [expRaw, sig] = token.split('.')
  const exp = Number(expRaw)
  if (!sig || !Number.isInteger(exp) || exp * 1000 < now) return false
  const a = Buffer.from(sign(productId, exp))
  const b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}
