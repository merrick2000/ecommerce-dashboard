import {
  defaultChannelPrefs,
  NOTIFICATION_EVENT_KEYS,
  NOTIFICATION_EVENTS,
  notificationPrefsSchema,
  pushSubscriptionSchema,
  type NotificationConfig,
  type NotificationDevice,
  type NotificationPreferencesView,
} from '@zuri/shared'
import { and, desc, eq, gt } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { notificationSettings, pushSubscriptions, telegramLinks, users } from '../db/schema'
import { can, requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { randomToken, safeEqual, sha256 } from '../lib/crypto'
import { notFound } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { describeDevice } from '../services/account'
import { getBotUsername, getVapidKeys, sendPushToUser, telegramEnabled, telegramWebhookSecret } from '../services/notifications'
import { sendTelegramTo } from '../services/notify'

/** Réglages de l'utilisateur connecté, tous appareils et toutes boutiques confondus. */
export const notificationRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/config', async (c) => {
    const config: NotificationConfig = {
      vapidPublicKey: (await getVapidKeys()).publicKey,
      telegram: { enabled: telegramEnabled(), botUsername: await getBotUsername(), linked: Boolean(c.get('user').telegramChatId) },
    }
    return c.json(config)
  })
  .post('/push/subscribe', rateLimit({ key: 'push-sub', limit: 30, windowSec: 600 }), v('json', pushSubscriptionSchema), async (c) => {
    const { endpoint, keys, label } = c.req.valid('json')
    const user = c.get('user')
    const name = (label?.trim() || describeDevice(c.req.header('user-agent'))).slice(0, 120)
    // Un même navigateur réabonné (ou passé à un autre compte) : on rattache l'abonnement au compte courant.
    await db
      .insert(pushSubscriptions)
      .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, label: name })
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, label: name } })
    return c.json({ ok: true })
  })
  .post('/push/unsubscribe', v('json', z.object({ endpoint: z.string().url().max(1000) })), async (c) => {
    await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, c.req.valid('json').endpoint), eq(pushSubscriptions.userId, c.get('user').id)))
    return c.json({ ok: true })
  })
  .get('/devices', async (c) => {
    const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, c.get('user').id)).orderBy(desc(pushSubscriptions.createdAt))
    const devices: NotificationDevice[] = rows.map((r) => ({ id: r.id, label: r.label, createdAt: r.createdAt.toISOString(), lastUsedAt: r.lastUsedAt?.toISOString() ?? null }))
    return c.json(devices)
  })
  .delete('/devices/:id', v('param', z.object({ id: z.coerce.number().int().positive() })), async (c) => {
    const [row] = await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.id, c.req.valid('param').id), eq(pushSubscriptions.userId, c.get('user').id)))
      .returning({ id: pushSubscriptions.id })
    if (!row) throw notFound('Appareil')
    return c.json({ ok: true })
  })
  /** Notification d'essai sur tous les appareils et sur Telegram. */
  .post('/test', rateLimit({ key: 'notif-test', limit: 10, windowSec: 600 }), async (c) => {
    const user = c.get('user')
    const push = await sendPushToUser(user.id, {
      title: 'Notification de test',
      body: 'Tout fonctionne : vous serez prévenu ici à chaque vente.',
      url: '/',
      event: 'test',
      tag: 'test',
      sound: 'sale',
    })
    let telegram = false
    if (user.telegramChatId && telegramEnabled()) {
      telegram = await sendTelegramTo(user.telegramChatId, '<b>Notification de test</b>\nTout fonctionne : vous serez prévenu ici à chaque vente.')
        .then(() => true)
        .catch(() => false)
    }
    return c.json({ push, telegram })
  })
  /** Lien t.me/<bot>?start=<code> : ouvrir le lien dans Telegram relie la conversation au compte. */
  .post('/telegram/link', rateLimit({ key: 'tg-link', limit: 10, windowSec: 600 }), async (c) => {
    const bot = await getBotUsername()
    if (!bot) throw notFound('Bot Telegram')
    const code = randomToken(18)
    await db.insert(telegramLinks).values({ codeHash: sha256(code), userId: c.get('user').id, expiresAt: new Date(Date.now() + 15 * 60_000) })
    return c.json({ url: `https://t.me/${bot}?start=${code}` })
  })
  .delete('/telegram', async (c) => {
    await db.update(users).set({ telegramChatId: null }).where(eq(users.id, c.get('user').id))
    return c.json({ ok: true })
  })

/** Préférences par boutique (sous /stores/:storeId/notifications) : seuls les événements accessibles au membre. */
export const storeNotificationRoutes = new Hono<AppEnv>()
  .get('/preferences', async (c) => {
    const access = c.get('access')
    const [row] = await db
      .select()
      .from(notificationSettings)
      .where(and(eq(notificationSettings.userId, access.userId), eq(notificationSettings.storeId, c.get('store').id)))
      .limit(1)
    const view: NotificationPreferencesView = {
      events: NOTIFICATION_EVENT_KEYS.filter((e) => can(access, NOTIFICATION_EVENTS[e].permission)).map((event) => ({
        event,
        label: NOTIFICATION_EVENTS[event].label,
        description: NOTIFICATION_EVENTS[event].description,
        channels: row?.prefs[event] ?? defaultChannelPrefs(event, access.role),
      })),
    }
    return c.json(view)
  })
  .put('/preferences', v('json', z.object({ prefs: notificationPrefsSchema })), async (c) => {
    const access = c.get('access')
    const storeId = c.get('store').id
    // On ne garde que les événements auxquels le membre a droit.
    const prefs = Object.fromEntries(Object.entries(c.req.valid('json').prefs).filter(([e]) => can(access, NOTIFICATION_EVENTS[e as keyof typeof NOTIFICATION_EVENTS].permission)))
    await db
      .insert(notificationSettings)
      .values({ userId: access.userId, storeId, prefs })
      .onConflictDoUpdate({ target: [notificationSettings.userId, notificationSettings.storeId], set: { prefs, updatedAt: new Date() } })
    return c.json({ ok: true })
  })

/** Webhook du bot Telegram (public, authentifié par le secret déclaré à setWebhook). */
export const telegramWebhookRoutes = new Hono<AppEnv>().post('/webhooks/telegram', async (c) => {
  if (!telegramEnabled() || !safeEqual(c.req.header('x-telegram-bot-api-secret-token') ?? '', telegramWebhookSecret())) return c.json({ ok: false }, 401)
  const update = (await c.req.json().catch(() => null)) as { message?: { text?: string; chat?: { id: number } } } | null
  const text = update?.message?.text?.trim() ?? ''
  const chatId = update?.message?.chat?.id
  if (!chatId) return c.json({ ok: true })
  const reply = (html: string) => sendTelegramTo(String(chatId), html).catch((err) => console.error('[telegram] reply', err))

  const start = text.match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{10,64})$/)
  if (start) {
    const [link] = await db
      .delete(telegramLinks)
      .where(and(eq(telegramLinks.codeHash, sha256(start[1]!)), gt(telegramLinks.expiresAt, new Date())))
      .returning({ userId: telegramLinks.userId })
    if (!link) {
      await reply('Ce lien a expiré. Retournez dans Zuri (menu Notifications) et cliquez à nouveau sur « Relier Telegram ».')
      return c.json({ ok: true })
    }
    const [user] = await db.update(users).set({ telegramChatId: String(chatId) }).where(eq(users.id, link.userId)).returning({ name: users.name })
    await reply(`C’est fait, ${user?.name ?? ''} ! Vos notifications Zuri arriveront ici.\n\nAstuce : dans les réglages de cette conversation, choisissez un son de notification qui vous plaît (ex. un son de caisse).\n\nEnvoyez /stop pour ne plus rien recevoir.`)
    return c.json({ ok: true })
  }
  if (/^\/stop/.test(text)) {
    await db.update(users).set({ telegramChatId: null }).where(eq(users.telegramChatId, String(chatId)))
    await reply('Vous ne recevrez plus de notifications ici. Pour les réactiver, reliez Telegram depuis Zuri.')
    return c.json({ ok: true })
  }
  await reply('Bonjour ! Je suis le bot de notifications Zuri. Pour me relier à votre compte, ouvrez Zuri, menu Notifications, puis « Relier Telegram ».')
  return c.json({ ok: true })
})
