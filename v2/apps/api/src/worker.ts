/**
 * Process séparé : exécute les tâches de fond (emails, Telegram, CAPI, relances).
 * Une seule planification cron, même avec plusieurs instances (pg-boss verrouille).
 */
import { getBoss, type JobPayloads } from './jobs/queue'
import { handleAccountNotify, handleCapiPurchase, handleLeadCapi, handleLeadsNotifySellers, handleLeadsRemind, handleCustomerStatus, handleOrderCapiLead, handleOrderNotifyNew, handleOrderPaid } from './jobs/handlers'
import { reconcilePendingPayments } from './payments/service'
import { dispatchNotification } from './services/notifications'
import { runOnboarding } from './services/onboarding'
import { runBillingRecovery } from './services/billing-recovery'
import { sendFirstProductCampaign } from './services/activation'
import { notifyPlatformAdmins } from './services/admin-notify'
import { checkReferralReward } from './services/referrals'
import { pushAnnouncement } from './services/announcements'

const boss = await getBoss()

await boss.work<JobPayloads['order.paid']>('order.paid', async ([job]) => job && handleOrderPaid(job.data))
await boss.work<JobPayloads['order.notify-new']>('order.notify-new', async ([job]) => job && handleOrderNotifyNew(job.data))
await boss.work<JobPayloads['order.customer-status']>('order.customer-status', async ([job]) => job && handleCustomerStatus(job.data))
await boss.work<JobPayloads['account.notify']>('account.notify', async ([job]) => job && handleAccountNotify(job.data))
await boss.work<JobPayloads['notify.dispatch']>('notify.dispatch', async ([job]) => job && dispatchNotification(job.data))
await boss.work('leads.remind', async () => {
  await handleLeadsRemind()
  await handleLeadsNotifySellers()
})

await boss.work('payments.reconcile', async () => reconcilePendingPayments())
await boss.work<JobPayloads['order.capi-purchase']>('order.capi-purchase', async ([job]) => job && handleCapiPurchase(job.data))
await boss.work<JobPayloads['announcement.push']>('announcement.push', async ([job]) => job && pushAnnouncement(job.data.id))
await boss.work<JobPayloads['referral.check']>('referral.check', async ([job]) => job && checkReferralReward(job.data.storeId))
await boss.work<JobPayloads['admin.notify']>('admin.notify', async ([job]) => job && notifyPlatformAdmins(job.data))
await boss.work<JobPayloads['order.capi-lead']>('order.capi-lead', async ([job]) => job && handleOrderCapiLead(job.data))
await boss.work<JobPayloads['lead.capi']>('lead.capi', async ([job]) => job && handleLeadCapi(job.data))
await boss.work('activation.campaign', async () => {
  const n = await sendFirstProductCampaign()
  console.log(`[démarrage] ${n} email(s) « premier produit » envoyé(s)`)
})
await boss.work('onboarding.run', async () => {
  const n = await runOnboarding()
  if (n) console.log(`[onboarding] ${n} email(s) envoyé(s)`)
  const b = await runBillingRecovery()
  if (b) console.log(`[abonnements] ${b} relance(s) de paiement abandonné`)
})

await boss.schedule('leads.remind', '*/5 * * * *')
await boss.schedule('payments.reconcile', '*/5 * * * *')
// Toutes les heures (envoi seulement en journée, heure d'Afrique), jamais deux fois le même email.
await boss.schedule('onboarding.run', '10 * * * *')

console.log('👷 Worker démarré')

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await boss.stop({ graceful: true, timeout: 20_000 })
    process.exit(0)
  })
}
