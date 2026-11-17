/**
 * Résolution hôte → slug de boutique (sous-domaine ou domaine personnalisé).
 * Cache en mémoire par isolat, y compris les résultats négatifs, avec délai court.
 */
import { env } from 'cloudflare:workers'
import { ApiError, apiGet } from './api'

const TTL_OK = 5 * 60_000
const TTL_MISS = 60_000
const cache = new Map<string, { slug: string | null; exp: number }>()
const inflight = new Map<string, Promise<string | null>>()

export function normalizeHost(host: string): string {
  return host.toLowerCase().split(':')[0]!.replace(/\.$/, '')
}

/** Vrai si l'hôte est le domaine « plateforme » (URLs avec slug). */
export function isPlatformHost(host: string): boolean {
  const h = normalizeHost(host)
  const platform = (env.PLATFORM_HOST ?? '').toLowerCase()
  if (platform && h === platform) return true
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.workers.dev')) return true
  // Aucun domaine configuré : tout hôte est traité comme plateforme.
  return !env.BASE_DOMAIN && !platform
}

export async function resolveHost(host: string): Promise<string | null> {
  const h = normalizeHost(host)
  const now = Date.now()
  const hit = cache.get(h)
  if (hit && hit.exp > now) return hit.slug
  const pending = inflight.get(h)
  if (pending) return pending
  const p = (async () => {
    try {
      const r = await apiGet<{ slug: string | null }>(`/stores/resolve?host=${encodeURIComponent(h)}`, { timeoutMs: 2500 })
      cache.set(h, { slug: r.slug, exp: now + (r.slug ? TTL_OK : TTL_MISS) })
      return r.slug
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        cache.set(h, { slug: null, exp: now + TTL_MISS })
        return null
      }
      // Origine injoignable : on réutilise une valeur expirée plutôt que d'échouer.
      if (hit) return hit.slug
      throw e
    } finally {
      inflight.delete(h)
    }
  })()
  inflight.set(h, p)
  if (cache.size > 5000) cache.clear()
  return p
}
