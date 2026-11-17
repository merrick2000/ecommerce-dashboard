/** fetch JSON vers le relais /api/v1 du même domaine, avec délai et erreurs normalisées. */
export interface HttpResult<T> {
  ok: boolean
  status: number
  data: T | null
  error: { error?: string; code?: string; issues?: { path: string; message: string }[] } | null
  /** Vrai si la requête n'a pas abouti (réseau coupé, délai dépassé). */
  network: boolean
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<HttpResult<T>> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 20_000)
  try {
    const res = await fetch(`/api/v1${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: init.body === undefined ? { accept: 'application/json' } : { 'content-type': 'application/json', accept: 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: ctrl.signal,
    })
    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      /* corps vide */
    }
    return res.ok ? { ok: true, status: res.status, data: json as T, error: null, network: false } : { ok: false, status: res.status, data: null, error: (json as HttpResult<T>['error']) ?? {}, network: (json as { code?: string } | null)?.code === 'origin_unreachable' }
  } catch {
    return { ok: false, status: 0, data: null, error: null, network: true }
  } finally {
    clearTimeout(timer)
  }
}

export const fmt = (s: string, ...args: (string | number)[]) => s.replace(/\{(\d)\}/g, (_, i: string) => String(args[Number(i)] ?? ''))
