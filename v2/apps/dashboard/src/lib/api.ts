/**
 * Client HTTP typé. Même origine (/api), session par cookie httpOnly :
 * aucun jeton n'est manipulé côté JS.
 */
import type { ApiError as ApiErrorBody } from '@zuri/shared'

export interface FieldIssue {
  path: string
  message: string
}

export class ApiError extends Error {
  status: number
  code?: string
  issues: FieldIssue[]

  constructor(status: number, body: Partial<ApiErrorBody> | null) {
    // Erreur de saisie : le message précis du premier champ en cause plutôt que « Données invalides ».
    const firstIssue = body?.code === 'validation' && Array.isArray(body?.issues) ? (body.issues as FieldIssue[]).find((i) => typeof i?.message === 'string')?.message : undefined
    super(
      firstIssue ??
      body?.error ??
        (status === 0
          ? 'Connexion impossible. Vérifiez votre réseau.'
          : // Réponse du serveur d'hébergement (redémarrage, mise à jour) plutôt que de l'API elle-même.
            status === 502 || status === 503 || status === 504
            ? 'Le serveur redémarre ou est momentanément indisponible. Réessayez dans un instant.'
            : `Erreur ${status}`),
    )
    this.status = status
    this.code = body?.code
    this.issues = Array.isArray(body?.issues) ? (body.issues as FieldIssue[]).filter((i) => typeof i?.path === 'string') : []
  }

  /** Erreurs de validation 422 → { champ: message } pour les formulaires. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const i of this.issues) if (!(i.path in out)) out[i.path] = i.message
    return out
  }
}

type Listener = () => void
const unauthorizedListeners = new Set<Listener>()
/** Appelé à chaque 401 (session expirée) : l'app redirige vers /login. */
export function onUnauthorized(fn: Listener) {
  unauthorizedListeners.add(fn)
  return () => unauthorizedListeners.delete(fn)
}

export type Query = Record<string, string | number | boolean | null | undefined>

export function withQuery(path: string, query?: Query) {
  if (!query) return path
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  const s = qs.toString()
  return s ? `${path}?${s}` : path
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Query
  /** Ne pas déclencher la redirection sur 401 (ex. GET /auth/me). */
  silent401?: boolean
  signal?: AbortSignal
  headers?: Record<string, string>
}

/** Combine le signal d'annulation de l'appelant et une limite de temps (compatible navigateurs anciens). */
function withTimeout(outer: AbortSignal | undefined, ms: number) {
  const ctrl = new AbortController()
  let fired = false
  const timer = setTimeout(() => {
    fired = true
    ctrl.abort()
  }, ms)
  if (outer) {
    if (outer.aborted) ctrl.abort()
    else outer.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  ctrl.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
  return { signal: ctrl.signal, timedOut: () => fired, done: () => clearTimeout(timer) }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  let res: Response
  // Limite de 35 s : au-delà, message clair au lieu d'un bouton qui tourne sans fin.
  // Imports de produits et rédaction IA (images distantes, IA) : jusqu'à 3 min ; le reste : 35 s.
  const { signal, timedOut } = withTimeout(opts.signal, path.includes('/products/import/') || path.includes('/products/ai/') ? 175_000 : 35_000)
  try {
    res = await fetch(withQuery(`/api${path}`, opts.query), {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers: { ...(opts.body !== undefined && !isForm ? { 'content-type': 'application/json' } : {}), ...opts.headers },
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal,
    })
  } catch (e) {
    if (timedOut() && !opts.signal?.aborted) throw new ApiError(0, { error: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.', code: 'timeout' })
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, null)
  }
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    if (res.status === 401 && !opts.silent401) unauthorizedListeners.forEach((fn) => fn())
    throw new ApiError(res.status, typeof data === 'object' ? (data as ApiErrorBody) : null)
  }
  return data as T
}

/**
 * Opérations longues (rédaction IA, import par lien) : lancées en arrière-plan côté serveur, puis résultat
 * demandé toutes les 2 s. Aucune connexion ne reste ouverte longtemps (les relais coupent au-delà de 60 s).
 */
const LONG_TASK = /^\/stores\/([^/]+)\/(?:products\/(?:ai\/rewrite-description|import\/url\/(?:preview|preview-text|improve|commit))|sales-popup\/generate)$/

type TaskState<T> = { status: 'pending'; taskId?: string } | { status: 'done'; httpStatus: number; result: T } | { status: 'error'; httpStatus: number; error: ApiErrorBody }

async function runTask<T>(path: string, body: unknown, storeId: string): Promise<T> {
  const started = await request<{ taskId?: string; status?: string } & T>(path, { method: 'POST', body: body ?? {}, headers: { 'x-async': '1' } })
  // Serveur pas encore à jour : il a répondu directement.
  if (!started || typeof started !== 'object' || !('taskId' in started) || !started.taskId) return started as T
  const deadline = Date.now() + 6 * 60_000
  let misses = 0
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    let state: TaskState<T>
    try {
      state = await request<TaskState<T>>(`/stores/${storeId}/products/ai/tasks/${started.taskId}`)
      misses = 0
    } catch (e) {
      // Coupure réseau ou redémarrage passager : on réessaie quelques fois avant d'abandonner.
      if (e instanceof ApiError && (e.status === 0 || e.status >= 502) && ++misses < 5) continue
      throw e
    }
    if (state.status === 'done') return state.result
    if (state.status === 'error') throw new ApiError(state.httpStatus, state.error)
  }
  throw new ApiError(0, { error: 'L’opération prend trop de temps. Réessayez.', code: 'timeout' })
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => {
    const long = LONG_TASK.exec(path)
    return long ? runTask<T>(path, body, long[1]!) : request<T>(path, { method: 'POST', body: body ?? {} })
  },
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File, query?: Query, onProgress?: (ratio: number) => void) => uploadWithProgress<T>(path, file, query, onProgress),
}

/**
 * Envoi de fichier avec progression (fetch ne sait pas suivre l'envoi : on passe par XMLHttpRequest).
 * Mêmes conventions d'erreur que request().
 */
function uploadWithProgress<T>(path: string, file: File, query?: Query, onProgress?: (ratio: number) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', withQuery(`/api${path}`, query))
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
    }
    xhr.onerror = () => reject(new ApiError(0, null))
    xhr.onload = () => {
      let data: unknown = null
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        data = xhr.responseText
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T)
      if (xhr.status === 401) unauthorizedListeners.forEach((fn) => fn())
      reject(new ApiError(xhr.status, typeof data === 'object' ? (data as ApiErrorBody) : null))
    }
    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
  })
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return e.message || 'Vous n’avez pas les droits pour cette action.'
    if (e.code === 'order_taken') return e.message || 'Cette commande est déjà prise par un autre membre de l’équipe.'
    if (e.status === 503 && e.code === 's3_unconfigured') return 'Le stockage de fichiers n’est pas configuré sur le serveur.'
    return e.message
  }
  if (e instanceof Error) return e.message
  return 'Une erreur est survenue'
}
