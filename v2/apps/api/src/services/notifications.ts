/**
 * Notifications d'équipe : push (téléphone, PC), email, Telegram.
 *
 * Règle d'or : un membre n'est notifié que de ce qu'il a le droit de voir.
 * Chaque événement exige une permission (NOTIFICATION_EVENTS) et, s'il concerne
 * des produits, le membre doit avoir au moins un de ces produits dans son périmètre.
 * Les montants ne sont envoyés qu'aux membres qui peuvent voir le chiffre d'affaires.
 */
import { defaultChannelPrefs, NOTIFICATION_EVENTS, type ChannelPrefs, type NotificationEvent, type PushPayload, type StoreRole } from '@zuri/shared'
import { and, eq, inArray } from 'drizzle-orm'
import webpush from 'web-push'
import { db } from '../db/client'
import { appSecrets, notificationSettings, pushSubscriptions, storeMembers, stores, users } from '../db/schema'
import { can, loadAccess } from '../lib/auth'
import { decrypt, encrypt, sha256 } from '../lib/crypto'
import { env } from '../lib/env'
import { escapeHtml } from '../lib/sanitize'
import { enqueue } from '../jobs/queue'
import { notificationEmail } from './emails'
import { sendEmail, sendTelegramTo, telegramApi } from './notify'

export interface NotifyData {
  title: string
  /** Texte sans montant (membres sans accès au chiffre d'affaires). */
  body: string
  /** Même texte avec le montant, pour ceux qui peuvent le voir. */
  bodyWithAmount?: string
  /** Chemin dans le dashboard (ex. /stores/shp_…/orders/ord_…). */
  path: string
  /** Produits concernés : filtre par périmètre. null/absent = pas de filtre produit. */
  productIds?: string[] | null
  /** Seul ce membre est notifié (attribution). */
  targetUserId?: number
  /** Ce membre n'est pas notifié (l'auteur de l'action). */
  excludeUserId?: number
  tag?: string
  sound?: PushPayload['sound']
}

/** Met la notification en file : l'envoi réel se fait dans le worker (jamais dans la requête HTTP). */
export async function notify(storeId: string, event: NotificationEvent, data: NotifyData) {
  await enqueue('notify.dispatch', { storeId, event, data })
}

// ─── Clés VAPID (push web), générées une fois et gardées chiffrées en base ───

let vapidCache: { publicKey: string; privateKey: string } | null = null

export async function getVapidKeys() {
  if (vapidCache) return vapidCache
  const read = async () => {
    const [row] = await db.select().from(appSecrets).where(eq(appSecrets.key, 'vapid')).limit(1)
    return row ? (JSON.parse(decrypt(row.valueEnc)) as { publicKey: string; privateKey: string }) : null
  }
  let keys = await read()
  if (!keys) {
    const generated = webpush.generateVAPIDKeys()
    // Deux processus (API + worker) peuvent démarrer en même temps : le premier gagne, l'autre relit.
    await db.insert(appSecrets).values({ key: 'vapid', valueEnc: encrypt(JSON.stringify(generated)) }).onConflictDoNothing()
    keys = (await read())!
  }
  vapidCache = keys
  return keys
}

// ─── Telegram ────────────────────────────────────────────────────────────────

export const telegramEnabled = () => Boolean(env.TELEGRAM_BOT_TOKEN)
/** Secret attendu dans l'en-tête X-Telegram-Bot-Api-Secret-Token du webhook. */
export const telegramWebhookSecret = () => sha256(`telegram-webhook:${env.APP_KEY}`).slice(0, 48)

let botUsername: string | null = null
export async function getBotUsername(): Promise<string | null> {
  if (!telegramEnabled()) return null
  if (botUsername) return botUsername
  try {
    const me = await telegramApi<{ username: string }>('getMe', {})
    botUsername = me.username
  } catch (err) {
    console.error('[telegram] getMe', err)
  }
  return botUsername
}

/** Déclare le webhook du bot (idempotent), au démarrage de l'API. */
export async function ensureTelegramWebhook() {
  if (!telegramEnabled()) return
  try {
    await telegramApi('setWebhook', {
      url: `${env.APP_URL.replace(/\/$/, '')}/api/v1/webhooks/telegram`,
      secret_token: telegramWebhookSecret(),
      allowed_updates: ['message'],
    })
  } catch (err) {
    console.error('[telegram] setWebhook', err)
  }
}

// ─── Destinataires ───────────────────────────────────────────────────────────

export interface Recipient {
  userId: number
  name: string
  email: string
  telegramChatId: string | null
  role: StoreRole
  canSeeRevenue: boolean
  channels: ChannelPrefs
}

/** Membres à notifier pour cet événement, avec leurs canaux. Exporté pour les tests. */
export async function resolveRecipients(storeId: string, event: NotificationEvent, data: Pick<NotifyData, 'productIds' | 'targetUserId' | 'excludeUserId'>): Promise<Recipient[]> {
  const members = await db
    .select({ member: storeMembers, name: users.name, email: users.email, telegramChatId: users.telegramChatId })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(eq(storeMembers.storeId, storeId))
  const settings = members.length
    ? await db
        .select()
        .from(notificationSettings)
        .where(and(eq(notificationSettings.storeId, storeId), inArray(notificationSettings.userId, members.map((m) => m.member.userId))))
    : []
  const permission = NOTIFICATION_EVENTS[event].permission
  const out: Recipient[] = []
  for (const m of members) {
    const userId = m.member.userId
    if (data.targetUserId && userId !== data.targetUserId) continue
    if (data.excludeUserId && userId === data.excludeUserId) continue
    const access = await loadAccess(storeId, userId, m.member)
    if (!access || !can(access, permission)) continue
    if (data.productIds?.length && access.productIds && !data.productIds.some((id) => access.productIds!.includes(id))) continue
    const prefs = settings.find((s) => s.userId === userId)?.prefs[event] ?? defaultChannelPrefs(event, access.role)
    if (!prefs.push && !prefs.email && !prefs.telegram) continue
    out.push({ userId, name: m.name, email: m.email, telegramChatId: m.telegramChatId, role: access.role, canSeeRevenue: can(access, 'stats.revenue'), channels: prefs })
  }
  return out
}

// ─── Envoi ───────────────────────────────────────────────────────────────────

const appUrl = (path: string) => `${env.APP_URL.replace(/\/$/, '')}${path}`

/** Envoie un push à tous les appareils d'un membre ; supprime les abonnements expirés. */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (!subs.length) return 0
  const vapid = await getVapidKeys()
  let sent = 0
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
          vapidDetails: { subject: `mailto:compte@${new URL(env.APP_URL).hostname.replace(/^app\./, '')}`, publicKey: vapid.publicKey, privateKey: vapid.privateKey },
          TTL: 6 * 3600,
          urgency: 'high',
          topic: payload.tag?.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || undefined,
        })
        sent++
        await db.update(pushSubscriptions).set({ lastUsedAt: new Date() }).where(eq(pushSubscriptions.id, sub.id))
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410 : l'appareil s'est désabonné (notifications refusées, navigateur réinstallé).
        if (status === 404 || status === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        else console.error('[push]', status, (err as Error).message)
      }
    }),
  )
  return sent
}

/** Exécuté par le worker : résout les destinataires et envoie sur chaque canal choisi. */
export async function dispatchNotification(job: { storeId: string; event: NotificationEvent; data: NotifyData }) {
  const { storeId, event, data } = job
  const [store] = await db.select({ name: stores.name }).from(stores).where(eq(stores.id, storeId)).limit(1)
  if (!store) return
  const recipients = await resolveRecipients(storeId, event, data)
  const url = appUrl(data.path)
  await Promise.all(
    recipients.map(async (r) => {
      const body = r.canSeeRevenue && data.bodyWithAmount ? data.bodyWithAmount : data.body
      const tasks: Promise<unknown>[] = []
      if (r.channels.push) tasks.push(sendPushToUser(r.userId, { title: data.title, body, url, tag: data.tag, event, sound: data.sound }))
      if (r.channels.email) {
        const mail = notificationEmail({ title: data.title, body, url, storeName: store.name })
        tasks.push(sendEmail(r.email, mail.subject, mail.html, { fromName: `${store.name} via Zuri`, localPart: 'notifications' }))
      }
      if (r.channels.telegram && r.telegramChatId && telegramEnabled()) {
        tasks.push(sendTelegramTo(r.telegramChatId, `<b>${escapeHtml(data.title)}</b>\n${escapeHtml(body)}\n<i>${escapeHtml(store.name)}</i>\n\n<a href="${escapeHtml(url)}">Ouvrir dans Zuri</a>`))
      }
      const failed = (await Promise.allSettled(tasks)).filter((t) => t.status === 'rejected')
      if (failed.length) console.warn(`[notify] ${event} → ${r.userId} : ${failed.length} canal(aux) en échec`, failed.map((f) => (f as PromiseRejectedResult).reason?.message ?? f))
    }),
  )
}
