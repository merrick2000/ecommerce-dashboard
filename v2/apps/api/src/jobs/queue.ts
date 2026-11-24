import { PgBoss } from 'pg-boss'
import { env } from '../lib/env'
import type { AccountNotice } from '../services/account'
import type { NotificationEvent } from '@zuri/shared'
import type { NotifyData } from '../services/notifications'

/** Tâches asynchrones. Les données transportées restent minimales (des IDs), le worker relit la base. */
export interface JobPayloads {
  'order.paid': { orderId: string }
  'order.notify-new': { orderId: string }
  /** Email au client : commande confirmée ou colis en route. */
  'order.customer-status': { orderId: string; status: 'confirmed' | 'shipped' }
  'leads.remind': Record<string, never>
  'payments.reconcile': Record<string, never>
  'account.notify': AccountNotice
  'notify.dispatch': { storeId: string; event: NotificationEvent; data: NotifyData }
  /** Emails d'accompagnement des nouveaux vendeurs (toutes les heures). */
  'onboarding.run': Record<string, never>
}
export type JobName = keyof JobPayloads
export const JOB_NAMES: JobName[] = ['order.paid', 'order.notify-new', 'order.customer-status', 'leads.remind', 'payments.reconcile', 'account.notify', 'notify.dispatch', 'onboarding.run']

let boss: PgBoss | null = null
let starting: Promise<PgBoss> | null = null

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss
  starting ??= (async () => {
    const b = new PgBoss({ connectionString: env.DATABASE_URL, schema: 'pgboss' })
    b.on('error', (err) => console.error('[pg-boss]', err))
    await b.start()
    for (const name of JOB_NAMES) await b.createQueue(name, { retryLimit: 5, retryDelay: 30, retryBackoff: true })
    boss = b
    return b
  })()
  return starting
}

/**
 * En test, on n'écrit pas dans la file : les tâches sont collectées pour assertion.
 */
export const enqueued: { name: JobName; data: unknown }[] = []

export async function enqueue<N extends JobName>(name: N, data: JobPayloads[N], opts: { singletonKey?: string; startAfter?: number } = {}) {
  if (env.NODE_ENV === 'test') {
    enqueued.push({ name, data })
    return
  }
  const b = await getBoss()
  // singletonKey par défaut : une seule tâche « order.paid » par commande, même si on l'empile deux fois.
  const singletonKey = opts.singletonKey ?? ('orderId' in data ? `${name}:${(data as { orderId: string }).orderId}` : undefined)
  await b.send(name, data, { singletonKey, startAfter: opts.startAfter })
}
