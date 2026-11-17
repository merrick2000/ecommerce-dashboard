/**
 * Process séparé : exécute les tâches de fond (emails, Telegram, CAPI, relances).
 * Une seule planification cron, même avec plusieurs instances (pg-boss verrouille).
 */
import { getBoss, type JobPayloads } from './jobs/queue'
import { handleAccountNotify, handleLeadsNotifySellers, handleLeadsRemind, handleOrderNotifyNew, handleOrderPaid } from './jobs/handlers'
import { reconcilePendingPayments } from './payments/service'
import { dispatchNotification } from './services/notifications'

const boss = await getBoss()

await boss.work<JobPayloads['order.paid']>('order.paid', async ([job]) => job && handleOrderPaid(job.data))
await boss.work<JobPayloads['order.notify-new']>('order.notify-new', async ([job]) => job && handleOrderNotifyNew(job.data))
await boss.work<JobPayloads['account.notify']>('account.notify', async ([job]) => job && handleAccountNotify(job.data))
await boss.work<JobPayloads['notify.dispatch']>('notify.dispatch', async ([job]) => job && dispatchNotification(job.data))
await boss.work('leads.remind', async () => {
  await handleLeadsRemind()
  await handleLeadsNotifySellers()
})

await boss.work('payments.reconcile', async () => reconcilePendingPayments())

await boss.schedule('leads.remind', '*/5 * * * *')
await boss.schedule('payments.reconcile', '*/5 * * * *')

console.log('👷 Worker démarré')

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await boss.stop({ graceful: true, timeout: 20_000 })
    process.exit(0)
  })
}
