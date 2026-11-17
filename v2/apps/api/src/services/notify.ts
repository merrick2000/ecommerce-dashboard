import { env } from '../lib/env'

/** Appel à l'API Telegram du bot (si configuré). */
export async function telegramApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('Telegram non configuré')
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })
  const json = (await res.json().catch(() => null)) as { ok: boolean; result: T; description?: string } | null
  if (!res.ok || !json?.ok) throw new Error(`Telegram ${method} ${res.status}: ${json?.description ?? ''}`)
  return json.result
}

/** Message Telegram vers une conversation précise (HTML simple). */
export async function sendTelegramTo(chatId: string, html: string): Promise<void> {
  await telegramApi('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true })
}

export interface EmailOptions {
  /** Nom affiché comme expéditeur (ex. le nom de la boutique). L'adresse reste celle de MAIL_FROM. */
  fromName?: string | null
  /** Adresse où arrivent les réponses du destinataire (ex. l'email de support de la boutique). */
  replyTo?: string | null
  /** Partie avant le @ (ex. « compte ») : remplace celle de MAIL_FROM, même domaine vérifié. */
  localPart?: string
}

/** « Nom <adresse> » : garde l'adresse de MAIL_FROM, remplace le nom si fourni (nettoyé). */
export function buildFrom(mailFrom: string, fromName?: string | null, localPart?: string): string {
  let address = mailFrom.match(/<([^>]+)>/)?.[1] ?? mailFrom.trim()
  if (localPart && /^[a-z0-9._-]+$/i.test(localPart)) address = `${localPart}@${address.split('@')[1]}`
  const name = (fromName ?? '').replace(/["<>\r\n\\]/g, '').trim().slice(0, 60)
  if (!name) return localPart ? address : mailFrom
  return `"${name}" <${address}>`
}

export async function sendEmail(to: string, subject: string, html: string, opts: EmailOptions = {}): Promise<void> {
  const from = buildFrom(env.MAIL_FROM, opts.fromName, opts.localPart)
  if (!env.RESEND_API_KEY) {
    console.info(`[mail:dev] ${from} → ${to} | ${subject}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(opts.replyTo ? { reply_to: opts.replyTo } : {}) }),
    signal: AbortSignal.timeout(10_000),
  })
  // 4xx (adresse invalide…) : inutile de réessayer. 5xx : on laisse pg-boss réessayer.
  if (res.status >= 500) throw new Error(`Resend ${res.status}`)
  if (!res.ok) console.warn(`[mail] refusé ${res.status}: ${await res.text()}`)
}

export interface CapiEvent {
  pixelId: string
  accessToken: string
  testEventCode?: string | null
  eventName: 'Purchase' | 'Lead' | 'InitiateCheckout'
  eventId: string
  eventTime: Date
  sourceUrl?: string
  value: number
  currency: string
  user: { email?: string | null; phone?: string | null; firstName?: string | null; city?: string | null; country?: string | null; ip?: string; userAgent?: string; fbp?: string; fbc?: string }
  contentIds: string[]
}

const norm = (s: string) => s.trim().toLowerCase()
const hash = (s: string | null | undefined) => (s ? new Bun.CryptoHasher('sha256').update(norm(s)).digest('hex') : undefined)

/**
 * Facebook Conversions API. L'event_id est celui de la commande, partagé avec le pixel
 * navigateur : Meta déduplique et l'achat n'est compté qu'une fois.
 */
export async function sendCapiEvent(e: CapiEvent): Promise<void> {
  const body = {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(e.eventTime.getTime() / 1000),
        event_id: e.eventId,
        action_source: 'website',
        event_source_url: e.sourceUrl,
        user_data: {
          em: hash(e.user.email),
          ph: hash(e.user.phone?.replace(/\D/g, '')),
          fn: hash(e.user.firstName),
          ct: hash(e.user.city?.replace(/\s+/g, '')),
          country: hash(e.user.country),
          // IP et user-agent du CLIENT (capturés à la commande), pas ceux du serveur du provider.
          client_ip_address: e.user.ip,
          client_user_agent: e.user.userAgent,
          fbp: e.user.fbp,
          fbc: e.user.fbc,
        },
        custom_data: { value: e.value, currency: e.currency, content_ids: e.contentIds, content_type: 'product' },
      },
    ],
    ...(e.testEventCode ? { test_event_code: e.testEventCode } : {}),
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${e.pixelId}/events?access_token=${encodeURIComponent(e.accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status >= 500 || res.status === 429) throw new Error(`CAPI ${res.status}`)
  if (!res.ok) console.warn(`[capi] refusé ${res.status}: ${await res.text()}`)
}
