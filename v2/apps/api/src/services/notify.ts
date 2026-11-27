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
  /** Boutique : sert à journaliser la réponse de Meta (Paramètres, Suivi). */
  storeId?: string
  /** errors : ne journaliser que les échecs (événements fréquents comme InitiateCheckout). */
  logMode?: 'all' | 'errors'
  pixelId: string
  accessToken: string
  testEventCode?: string | null
  eventName: 'Purchase' | 'Lead' | 'InitiateCheckout' | 'PageView'
  eventId: string
  eventTime: Date
  sourceUrl?: string
  value: number
  currency: string
  user: { email?: string | null; phone?: string | null; name?: string | null; firstName?: string | null; city?: string | null; country?: string | null; ip?: string; userAgent?: string; fbp?: string; fbc?: string }
  contentIds: string[]
  /** Détail des articles (contents), nom du produit, numéro de commande. */
  contents?: { id: string; quantity: number; item_price?: number }[]
  contentName?: string
  orderId?: string
}

export interface CapiResult {
  ok: boolean
  status: number | null
  eventsReceived: number | null
  fbtraceId: string | null
  error: string | null
}

const norm = (s: string) => s.trim().toLowerCase()
const hash = (s: string | null | undefined) => (s && s.trim() ? new Bun.CryptoHasher('sha256').update(norm(s)).digest('hex') : undefined)

/** Indicatifs téléphoniques (pays des boutiques) : Meta attend le numéro international, sans + ni espaces. */
const DIAL: Record<string, string> = {
  BJ: '229', CI: '225', SN: '221', TG: '228', BF: '226', ML: '223', NE: '227', GN: '224', CM: '237', GA: '241', CG: '242', CD: '243', TD: '235', CF: '236',
  MG: '261', RW: '250', BI: '257', KE: '254', UG: '256', TZ: '255', NG: '234', GH: '233', SL: '232', LR: '231', GM: '220', GW: '245', MA: '212', TN: '216',
  DZ: '213', EG: '20', ZA: '27', ZM: '260', ZW: '263', CV: '238', MR: '222', DJ: '253', KM: '269', GQ: '240', ET: '251', SD: '249', AO: '244', MZ: '258',
  MW: '265', FR: '33', BE: '32', CH: '41', CA: '1', US: '1', GB: '44',
}
/** Pays où le 0 initial du numéro national disparaît dans le format international (ex. 0803… au Nigeria → 234803…). */
const TRUNK_ZERO = new Set(['NG', 'GH', 'KE', 'UG', 'TZ', 'ZA', 'MA', 'TN', 'DZ', 'EG', 'FR', 'BE', 'CH', 'RW', 'ZM', 'ZW', 'MW', 'MZ', 'ET', 'SD', 'SL', 'LR', 'GB'])

/** Numéro au format international sans + ni espaces (ex. 22997000000), à partir du numéro saisi et du pays. */
export function phoneForMeta(phone: string | null | undefined, country: string | null | undefined): string | undefined {
  if (!phone) return undefined
  const raw = phone.trim()
  let digits = raw.replace(/\D/g, '')
  if (!digits) return undefined
  if (raw.startsWith('+')) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  const cc = (country ?? '').toUpperCase()
  const dial = DIAL[cc]
  if (!dial || digits.startsWith(dial)) return digits
  if (TRUNK_ZERO.has(cc) && digits.startsWith('0')) digits = digits.slice(1)
  return dial + digits
}

/** Prénom et nom séparés (fn, ln) depuis le nom saisi. */
export function splitName(name: string | null | undefined): { fn?: string; ln?: string } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return {}
  return { fn: parts[0], ln: parts.length > 1 ? parts.slice(1).join(' ') : undefined }
}

const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as T

export function capiPayload(e: CapiEvent) {
  const { fn, ln } = splitName(e.user.name ?? e.user.firstName)
  const ph = phoneForMeta(e.user.phone, e.user.country)
  return {
    data: [
      clean({
        event_name: e.eventName,
        event_time: Math.floor(e.eventTime.getTime() / 1000),
        event_id: e.eventId,
        action_source: 'website',
        event_source_url: e.sourceUrl,
        user_data: clean({
          em: hash(e.user.email),
          ph: hash(ph),
          fn: hash(fn),
          ln: hash(ln),
          ct: hash(e.user.city?.replace(/\s+/g, '')),
          country: hash(e.user.country),
          // Identifiant stable du client (téléphone haché) : améliore la correspondance entre ses achats.
          external_id: hash(ph),
          // IP et navigateur du CLIENT (mémorisés à la commande), jamais ceux du serveur du prestataire.
          client_ip_address: e.user.ip,
          client_user_agent: e.user.userAgent,
          fbp: e.user.fbp,
          fbc: e.user.fbc,
        }),
        custom_data: clean({
          value: e.value,
          currency: e.currency,
          content_ids: e.contentIds.length ? e.contentIds : undefined,
          content_type: 'product',
          content_name: e.contentName,
          contents: e.contents?.length ? e.contents : undefined,
          num_items: e.contents?.reduce((s, c) => s + c.quantity, 0) || undefined,
          order_id: e.orderId,
        }),
      }),
    ],
    ...(e.testEventCode ? { test_event_code: e.testEventCode } : {}),
  }
}

/**
 * Facebook Conversions API. L'event_id est celui de la commande, partagé avec le pixel
 * navigateur : Meta déduplique et l'achat n'est compté qu'une fois.
 * Coupure réseau, 429 ou 5xx : 3 essais espacés, puis une erreur (la tâche est relancée plus tard).
 * Refus de Meta (4xx : jeton invalide…) : journalisé avec son message, pas de nouvel essai.
 */
export async function sendCapiEvent(e: CapiEvent): Promise<CapiResult> {
  const body = JSON.stringify(capiPayload(e))
  let last: CapiResult = { ok: false, status: null, eventsReceived: null, fbtraceId: null, error: 'Envoi impossible' }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await Bun.sleep(attempt * 1500)
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${e.pixelId}/events?access_token=${encodeURIComponent(e.accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
      })
      const json = (await res.json().catch(() => ({}))) as { events_received?: number; fbtrace_id?: string; error?: { message?: string; fbtrace_id?: string; error_user_msg?: string } }
      last = {
        ok: res.ok,
        status: res.status,
        eventsReceived: json.events_received ?? null,
        fbtraceId: json.fbtrace_id ?? json.error?.fbtrace_id ?? null,
        error: res.ok ? null : (json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`).slice(0, 300),
      }
      if (res.ok || (res.status < 500 && res.status !== 429)) break
    } catch (err) {
      last = { ok: false, status: null, eventsReceived: null, fbtraceId: null, error: `Réseau : ${(err as Error).message}`.slice(0, 300) }
    }
  }
  if (e.storeId && (e.logMode !== 'errors' || !last.ok)) await (await import('./capi-log')).recordCapi(e.storeId, { event: e.eventName, ref: e.orderId ?? null, test: Boolean(e.testEventCode), ...last })
  if (!last.ok) {
    console.warn(`[capi] ${e.eventName} ${e.orderId ?? ''} refusé : ${last.error} (fbtrace ${last.fbtraceId ?? '-'})`)
    if (last.status === null || last.status >= 500 || last.status === 429) throw new Error(`CAPI ${last.status ?? 'réseau'} : ${last.error}`)
  }
  return last
}
