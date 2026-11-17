/**
 * Client API côté serveur (rendu des pages) : appelle directement l'origine,
 * avec le secret partagé, jamais exposé au navigateur.
 */
import { env } from 'cloudflare:workers'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

export function originHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra)
  h.set('accept', 'application/json')
  if (env.EDGE_SECRET) h.set('x-edge-secret', env.EDGE_SECRET)
  return h
}

export function apiUrl(path: string): URL {
  return new URL(`/api/v1${path}`, env.API_ORIGIN)
}

/** GET JSON avec délai maximal ; 404 → ApiError(404), réseau/timeout → ApiError(503). */
export async function apiGet<T>(path: string, opts: { timeoutMs?: number } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), { headers: originHeaders(), signal: AbortSignal.timeout(opts.timeoutMs ?? 6000) })
  } catch {
    throw new ApiError(503, 'origin_unreachable', 'origin_unreachable')
  }
  if (!res.ok) {
    let code: string | undefined
    try {
      code = ((await res.json()) as { code?: string }).code
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(res.status, `API ${res.status}`, code)
  }
  return (await res.json()) as T
}
