/**
 * Relais navigateur → API pour /api/v1/* UNIQUEMENT (même domaine que la boutique :
 * pas de CORS, y compris sur les domaines perso). Rien d'autre n'est relayé.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const prerender = false

const FORWARD = ['content-type', 'accept', 'accept-language', 'user-agent', 'referer', 'cf-ipcountry']
const MAX_BODY = 64 * 1024

export const ALL: APIRoute = async ({ request, url, params }) => {
  const path = params.path ?? ''
  // Pas de traversée (« .. ») ni de chemin vide : seul /api/v1/<quelque chose> part vers l'origine.
  if (!path || path.split('/').some((s) => s === '..' || s === '.')) return Response.json({ error: 'Route introuvable', code: 'not_found' }, { status: 404 })

  const target = new URL(`/api/v1/${path}${url.search}`, env.API_ORIGIN)
  const headers = new Headers()
  for (const h of FORWARD) {
    const v = request.headers.get(h)
    if (v) headers.set(h, v)
  }
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip')
  if (ip) {
    headers.set('cf-connecting-ip', ip)
    headers.set('x-forwarded-for', ip)
  }
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''))
  if (env.EDGE_SECRET) headers.set('x-edge-secret', env.EDGE_SECRET)

  let body: ArrayBuffer | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return Response.json({ error: 'Requête trop volumineuse', code: 'too_large' }, { status: 413 })
    body = await request.arrayBuffer()
    if (body.byteLength > MAX_BODY) return Response.json({ error: 'Requête trop volumineuse', code: 'too_large' }, { status: 413 })
  }

  let res: Response
  try {
    res = await fetch(target, { method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(25_000) })
  } catch {
    return Response.json({ error: 'Service temporairement indisponible', code: 'origin_unreachable' }, { status: 502, headers: { 'cache-control': 'no-store' } })
  }
  const out = new Headers()
  for (const h of ['content-type', 'cache-control', 'retry-after']) {
    const v = res.headers.get(h)
    if (v) out.set(h, v)
  }
  if (!out.has('cache-control')) out.set('cache-control', 'no-store')
  return new Response(res.body, { status: res.status, headers: out })
}
