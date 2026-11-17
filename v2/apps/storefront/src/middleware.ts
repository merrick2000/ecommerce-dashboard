/**
 * - Hôte plateforme (PLATFORM_HOST, localhost) : les URLs portent le slug (/:slug/p/:id).
 * - Sous-domaine / domaine perso : hôte → slug via /stores/resolve, puis réécriture
 *   interne vers les mêmes pages (/p/:id → /:slug/p/:id).
 * - Cache HTML en périphérie (Cache API) pour le catalogue et la page de vente,
 *   avec une clé SANS paramètres (fbclid, utm, promo…) sinon chaque clic de pub serait un « miss ».
 */
import { env } from 'cloudflare:workers'
import { defineMiddleware } from 'astro:middleware'
import { isPlatformHost, normalizeHost, resolveHost } from './lib/resolve'

const PASS_THROUGH = /^\/(api\/|_astro\/|_server-islands\/|favicon|robots\.txt|404$|500$)/
const CACHEABLE = /^\/[^/]+(\/p\/\d+)?\/?$/

function withSecurityHeaders(res: Response): Response {
  try {
    res.headers.set('x-content-type-options', 'nosniff')
    res.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    return res
  } catch {
    const copy = new Response(res.body, res)
    copy.headers.set('x-content-type-options', 'nosniff')
    copy.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    return copy
  }
}

const unavailable = () =>
  new Response(
    '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Indisponible</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 16px;text-align:center"><h1>Boutique momentanément indisponible</h1><p>Réessayez dans quelques instants.</p><p><a href="">Réessayer</a></p></body></html>',
    { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30' } },
  )

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = ctx.url
  const rawHost = ctx.request.headers.get('host') ?? url.host
  const host = normalizeHost(rawHost)
  ctx.locals.publicOrigin = `${url.protocol}//${rawHost}`
  ctx.locals.publicPath = url.pathname
  ctx.locals.hostSlug = null
  ctx.locals.storeBase = ''

  if (PASS_THROUGH.test(url.pathname)) return withSecurityHeaders(await next())

  let internalPath = url.pathname
  if (isPlatformHost(host)) {
    const first = url.pathname.split('/')[1]
    ctx.locals.storeBase = first ? `/${first}` : ''
  } else {
    let slug: string | null
    try {
      slug = await resolveHost(host)
    } catch {
      return unavailable()
    }
    if (!slug) return withSecurityHeaders(await next('/404'))
    ctx.locals.hostSlug = slug
    // Lien « plateforme » ouvert sur le domaine de la boutique : on le garde tel quel.
    const prefixed = url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)
    ctx.locals.storeBase = prefixed ? `/${slug}` : ''
    internalPath = prefixed ? url.pathname : `/${slug}${url.pathname === '/' ? '' : url.pathname}`
  }

  const render = () => (internalPath === url.pathname ? next() : next(internalPath + url.search))

  const useCache = ctx.request.method === 'GET' && CACHEABLE.test(internalPath) && !import.meta.env.DEV && env.EDGE_CACHE !== 'off' && typeof caches !== 'undefined'
  if (!useCache) return withSecurityHeaders(await render())

  const key = new Request(`${url.protocol}//${host}${url.pathname}`, { method: 'GET' })
  const cache = (caches as unknown as { default: Cache }).default
  try {
    const hit = await cache.match(key)
    if (hit) {
      const res = new Response(hit.body, hit)
      res.headers.set('x-edge-cache', 'HIT')
      return withSecurityHeaders(res)
    }
  } catch {
    /* Cache API indisponible (workers.dev, dev) */
  }
  const res = withSecurityHeaders(await render())
  if (res.status === 200 && /s-maxage/.test(res.headers.get('cache-control') ?? '')) {
    try {
      const copy = res.clone()
      ctx.locals.cfContext?.waitUntil(cache.put(key, copy).catch(() => {}))
    } catch {
      /* ignore */
    }
    res.headers.set('x-edge-cache', 'MISS')
  }
  return res
})
