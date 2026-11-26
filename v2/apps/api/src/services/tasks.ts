/**
 * Tâches longues en arrière-plan (rédaction IA, import par lien) : la requête répond tout de suite avec un
 * numéro de tâche, le tableau de bord demande le résultat toutes les 2 s. Aucune connexion ne reste ouverte
 * longtemps : les relais (Cloudflare, proxy de l'hébergeur) coupent souvent au-delà de 60 s.
 * Gardées en mémoire 15 minutes (une seule instance d'API) ; perdues au redémarrage, le vendeur relance.
 */
import { randomBytes } from 'node:crypto'
import type { Context } from 'hono'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'

interface Task {
  storeId: string
  userId: number
  status: 'pending' | 'done' | 'error'
  httpStatus: number
  result?: unknown
  error?: { message: string; code: string; issues?: unknown }
  createdAt: number
}

const TTL = 15 * 60_000
const tasks = new Map<string, Task>()

function sweep() {
  const now = Date.now()
  for (const [id, t] of tasks) if (now - t.createdAt > TTL) tasks.delete(id)
}

/** Lance `work` en arrière-plan et répond 202 { taskId } ; le résultat se lit avec readTask. */
export function startTask(c: Context<AppEnv>, work: () => Promise<unknown>, okStatus = 200) {
  sweep()
  const id = `tsk_${randomBytes(12).toString('base64url')}`
  const task: Task = { storeId: c.get('store').id, userId: c.get('user').id, status: 'pending', httpStatus: 202, createdAt: Date.now() }
  tasks.set(id, task)
  void work().then(
    (result) => Object.assign(task, { status: 'done', httpStatus: okStatus, result }),
    (e: unknown) => {
      if (e instanceof HttpError) Object.assign(task, { status: 'error', httpStatus: e.status, error: { message: e.message, code: e.code ?? 'error' } })
      else {
        console.error('[tâche]', e)
        Object.assign(task, { status: 'error', httpStatus: 500, error: { message: 'Une erreur est survenue. Réessayez.', code: 'internal' } })
      }
    },
  )
  return c.json({ taskId: id, status: 'pending' as const }, 202)
}

/** État d'une tâche (réservée à la boutique et au membre qui l'a lancée). */
export function readTask(id: string, storeId: string, userId: number) {
  const t = tasks.get(id)
  if (!t || t.storeId !== storeId || t.userId !== userId) throw new HttpError(404, 'Cette opération a expiré. Relancez-la.', 'task_not_found')
  if (t.status === 'pending') return { status: 'pending' as const, elapsed: Math.round((Date.now() - t.createdAt) / 1000) }
  if (t.status === 'done') return { status: 'done' as const, httpStatus: t.httpStatus, result: t.result }
  return { status: 'error' as const, httpStatus: t.httpStatus, error: t.error }
}

/** Pour les tests. */
export const _tasks = tasks

/** En arrière-plan si le client le demande (en-tête x-async: 1, tableau de bord), sinon réponse directe (MCP, API). */
export async function maybeTask(c: Context<AppEnv>, work: () => Promise<unknown>, okStatus: 200 | 201 = 200) {
  if (c.req.header('x-async') === '1') return startTask(c, work, okStatus)
  return c.json((await work()) as object, okStatus)
}

/**
 * Pour l'ancien tableau de bord (sans mode arrière-plan) : si le travail dépasse 3 s, la réponse démarre
 * tout de suite et un espace est envoyé toutes les 5 s, pour que les relais ne coupent pas une connexion
 * silencieuse ; le JSON arrive à la fin (les espaces avant sont ignorés à la lecture).
 * Le statut 200 part avant la fin : un échec tardif est renvoyé sous la forme donnée par `onLateError`.
 */
export async function keepAliveJson(c: Context<AppEnv>, work: Promise<unknown>, onLateError: (e: unknown) => object): Promise<Response> {
  const settled = work.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  )
  const first = await Promise.race([settled, new Promise<null>((r) => setTimeout(() => r(null), 3000))])
  if (first) {
    if (first.ok) return c.json(first.value as object)
    throw first.error
  }
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const push = (s: string) => {
        try {
          ctrl.enqueue(enc.encode(s))
        } catch {
          /* client parti */
        }
      }
      push(' ')
      const timer = setInterval(() => push(' '), 5000)
      const r = await settled
      clearInterval(timer)
      if (!r.ok && !(r.error instanceof HttpError)) console.error('[réponse longue]', r.error)
      push(JSON.stringify(r.ok ? r.value : onLateError(r.error)))
      try {
        ctrl.close()
      } catch {
        /* déjà fermé */
      }
    },
  })
  return new Response(stream, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' } })
}
