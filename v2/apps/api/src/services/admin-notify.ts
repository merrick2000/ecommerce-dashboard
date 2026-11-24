/**
 * Alertes pour les administrateurs de la plateforme (super admin) : nouvel inscrit, nouveau message de contact.
 * Notification sur le téléphone (appareils où l'admin a activé les notifications) et Telegram s'il est relié ;
 * à défaut des deux, un email.
 */
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { layout } from './emails'
import { sendPushToUser, telegramEnabled } from './notifications'
import { sendEmail, sendTelegramTo } from './notify'

export interface AdminAlert {
  title: string
  body: string
  /** Chemin dans le dashboard (ex. /admin/messages). */
  path: string
  tag?: string
}

export async function notifyPlatformAdmins(alert: AdminAlert): Promise<number> {
  const admins = await db.select({ id: users.id, email: users.email, telegramChatId: users.telegramChatId }).from(users).where(and(eq(users.isPlatformAdmin, true), isNull(users.disabledAt)))
  const url = `${env.APP_URL.replace(/\/$/, '')}${alert.path}`
  let reached = 0
  for (const a of admins) {
    const pushed = await sendPushToUser(a.id, { title: alert.title, body: alert.body, url, tag: alert.tag, event: 'platform', sound: 'soft' }).catch(() => 0)
    let telegram = false
    if (a.telegramChatId && telegramEnabled()) {
      telegram = await sendTelegramTo(a.telegramChatId, `<b>${escapeHtml(alert.title)}</b>\n${escapeHtml(alert.body)}\n<a href="${escapeHtml(url)}">Ouvrir le super admin</a>`)
        .then(() => true)
        .catch(() => false)
    }
    if (!pushed && !telegram) await sendEmail(a.email, alert.title, layout('Zuri admin', `<p><strong>${escapeHtml(alert.title)}</strong></p><p>${escapeHtml(alert.body)}</p><p><a href="${escapeHtml(url)}">Ouvrir le super admin</a></p>`)).catch(() => undefined)
    reached++
  }
  return reached
}
