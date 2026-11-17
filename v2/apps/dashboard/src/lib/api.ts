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
    super(body?.error ?? (status === 0 ? 'Connexion impossible. Vérifiez votre réseau.' : `Erreur ${status}`))
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
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  let res: Response
  try {
    res = await fetch(withQuery(`/api${path}`, opts.query), {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers: opts.body !== undefined && !isForm ? { 'content-type': 'application/json' } : undefined,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal: opts.signal,
    })
  } catch (e) {
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

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ?? {} }),
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
    if (e.status === 503 && e.code === 's3_unconfigured') return 'Le stockage de fichiers n’est pas configuré sur le serveur.'
    return e.message
  }
  if (e instanceof Error) return e.message
  return 'Une erreur est survenue'
}
