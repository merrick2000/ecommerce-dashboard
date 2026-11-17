/**
 * Worker Cloudflare de l'app Zuri.
 * - Sert le dashboard (assets statiques, fallback SPA), configuré dans wrangler.jsonc.
 * - Relaie /api/* vers le serveur d'origine (Dokploy ou autre) sur le même domaine :
 *   pas de CORS, cookies de session first-party.
 */
export interface Env {
  ASSETS: Fetcher
  API_ORIGIN: string
  EDGE_SECRET?: string
}

/** En-têtes « hop-by-hop » ou internes à ne jamais transmettre à l'origine. */
const STRIP = ['host', 'x-edge-secret', 'x-forwarded-host', 'cf-worker']

export async function proxyApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const target = new URL(url.pathname + url.search, env.API_ORIGIN)
  const headers = new Headers(request.headers)
  for (const h of STRIP) headers.delete(h)
  // L'origine fait confiance à CF-Connecting-IP seulement si la requête porte le secret.
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''))
  if (env.EDGE_SECRET) headers.set('x-edge-secret', env.EDGE_SECRET)

  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
    // Jamais d'attente infinie : 30 s pour l'API, 10 min pour les envois de fichiers.
    signal: AbortSignal.timeout(url.pathname.includes('/uploads/') ? 600_000 : 30_000),
  }
  try {
    const res = await fetch(target, init)
    const out = new Response(res.body, res)
    // Les réponses authentifiées ne doivent jamais être mises en cache par un intermédiaire.
    if (!res.headers.has('cache-control')) out.headers.set('cache-control', 'private, no-store')
    return out
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      return Response.json({ error: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.', code: 'origin_timeout' }, { status: 504 })
    }
    return Response.json({ error: 'Service temporairement indisponible. Réessayez dans un instant.', code: 'origin_unreachable' }, { status: 502 })
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api' || pathname.startsWith('/api/')) return proxyApi(request, env)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
