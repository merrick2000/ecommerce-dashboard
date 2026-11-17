/**
 * Suivi : analytics interne (sendBeacon /api/v1/track) + pixels Facebook / TikTok.
 * Les pixels sont mis en file immédiatement (stubs) mais leurs scripts (~100 Ko)
 * ne sont chargés qu'après la première interaction ou un temps mort : jamais avant le LCP.
 * `?notrack` (aperçu propriétaire) coupe tout pour la session.
 */
import { getJSON, getStr, setJSON, setStr } from './storage'

export interface TrackConfig {
  storeId: number
  productId: number | null
  fb: string | null
  tt: string | null
  value?: number
  currency?: string
  name?: string
}

type Attribution = { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; referrer?: string; fbc?: string }

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; callMethod?: (...a: unknown[]) => void; push?: unknown; loaded?: boolean; version?: string }
    _fbq?: unknown
    ttq?: unknown[] & Record<string, unknown>
    TiktokAnalyticsObject?: string
  }
}

let cfg: TrackConfig | null = null
let pixelsQueued = false
let pixelsLoaded = false
const once = new Set<string>()

function config(): TrackConfig | null {
  if (cfg) return cfg
  try {
    const el = document.getElementById('sf-track')
    cfg = el?.textContent ? (JSON.parse(el.textContent) as TrackConfig) : null
  } catch {
    cfg = null
  }
  return cfg
}

/** Configuration fournie par un îlot (page commande : pixels mémorisés à la commande). */
export function setTrackConfig(c: TrackConfig): void {
  cfg = c
}

export function noTrack(): boolean {
  try {
    if (new URLSearchParams(location.search).has('notrack')) setStr('sf_nt', '1', 'session')
  } catch {
    /* ignore */
  }
  return getStr('sf_nt', 'session') === '1'
}

export function sessionId(): string {
  let id = getStr('sf_sid', 'session')
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '').slice(0, 32)
    setStr('sf_sid', id, 'session')
  }
  return id
}

function cookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]!) : undefined
}

/** UTM + référent mémorisés au premier atterrissage de la session (puis à chaque nouvelle URL utm). */
function attribution(): Attribution {
  let a = getJSON<Attribution>('sf_attr', 'session')
  try {
    const q = new URLSearchParams(location.search)
    const fresh: Attribution = {}
    const map: [keyof Attribution, string][] = [['utmSource', 'utm_source'], ['utmMedium', 'utm_medium'], ['utmCampaign', 'utm_campaign'], ['utmContent', 'utm_content']]
    for (const [k, p] of map) {
      const v = q.get(p)
      if (v) fresh[k] = v.slice(0, 255)
    }
    const fbclid = q.get('fbclid')
    if (fbclid) fresh.fbc = `fb.1.${Date.now()}.${fbclid}`.slice(0, 200)
    if (!a || Object.keys(fresh).length) {
      const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer.slice(0, 2048) : a?.referrer
      a = { ...(a ?? {}), ...fresh, referrer: ref || undefined }
      setJSON('sf_attr', a, 'session')
    }
  } catch {
    /* ignore */
  }
  return a ?? {}
}

/** Champs d'attribution joints à la commande (schéma publicOrderCreateSchema). */
export function orderAttribution() {
  const a = attribution()
  return {
    utmSource: a.utmSource,
    utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign,
    utmContent: a.utmContent,
    referrer: a.referrer,
    sessionId: sessionId(),
    fbp: cookie('_fbp')?.slice(0, 200),
    fbc: (cookie('_fbc') ?? a.fbc)?.slice(0, 200),
  }
}

export function track(eventType: string, metadata?: Record<string, unknown>): void {
  const c = config()
  if (!c || noTrack()) return
  const a = attribution()
  const body = JSON.stringify({ storeId: c.storeId, productId: c.productId, eventType, sessionId: sessionId(), referrer: a.referrer, utmSource: a.utmSource, utmMedium: a.utmMedium, utmCampaign: a.utmCampaign, metadata })
  try {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/v1/track', blob)) return
  } catch {
    /* repli fetch */
  }
  fetch('/api/v1/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
}

export function trackOnce(eventType: string, metadata?: Record<string, unknown>): void {
  if (once.has(eventType)) return
  once.add(eventType)
  track(eventType, metadata)
}

// ─── Pixels ──────────────────────────────────────────────────────────────────

function queuePixels(c: TrackConfig): void {
  if (pixelsQueued) return
  pixelsQueued = true
  const w = window
  if (c.fb && !w.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args)
      else n.queue!.push(args)
    } as NonNullable<Window['fbq']>
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    w.fbq = n
    w._fbq = n
    n('init', c.fb)
    n('track', 'PageView')
  }
  if (c.tt && !w.ttq) {
    w.TiktokAnalyticsObject = 'ttq'
    const ttq = [] as unknown as NonNullable<Window['ttq']>
    for (const m of ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']) {
      ttq[m] = (...args: unknown[]) => {
        ttq.push([m, ...args])
      }
    }
    w.ttq = ttq
    ;(ttq.page as () => void)()
  }
}

function loadScript(src: string): void {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

function loadPixels(): void {
  const c = config()
  if (pixelsLoaded || !c || noTrack()) return
  pixelsLoaded = true
  if (c.fb) loadScript('https://connect.facebook.net/en_US/fbevents.js')
  if (c.tt && window.ttq) {
    const ttq = window.ttq as Record<string, unknown>
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = { [c.tt]: Object.assign([], { _u: src }) }
    ttq._t = { [c.tt]: Date.now() }
    ttq._o = { [c.tt]: {} }
    loadScript(`${src}?sdkid=${encodeURIComponent(c.tt)}&lib=ttq`)
  }
}

/** Événement standard FB + son équivalent TikTok, avec identifiant de déduplication. */
export function pixel(fbEvent: string, ttEvent: string | null, extra: { value?: number; currency?: string; numItems?: number } = {}, eventId?: string): void {
  const c = config()
  if (!c || noTrack()) return
  queuePixels(c)
  const value = extra.value ?? c.value
  const currency = extra.currency ?? c.currency
  const id = c.productId != null ? String(c.productId) : undefined
  if (c.fb && window.fbq) {
    const params = { content_ids: id ? [id] : undefined, content_type: 'product', content_name: c.name, value, currency, num_items: extra.numItems }
    window.fbq('track', fbEvent, params, eventId ? { eventID: eventId } : undefined)
  }
  if (c.tt && ttEvent && window.ttq) {
    const params = { contents: id ? [{ content_id: id, content_type: 'product', content_name: c.name }] : undefined, value, currency }
    ;(window.ttq.track as (...a: unknown[]) => void)(ttEvent, params, eventId ? { event_id: eventId } : undefined)
  }
}

/** Purchase une seule fois par commande (jetons mémorisés), même si la page est rechargée. */
export function purchaseOnce(token: string, data: { value: number; currency: string; eventId: string | null; numItems?: number }): void {
  if (noTrack()) return
  const fired = getJSON<string[]>('sf_purchased') ?? []
  if (fired.includes(token)) return
  pixel('Purchase', 'CompletePayment', { value: data.value, currency: data.currency, numItems: data.numItems }, data.eventId ?? undefined)
  loadPixels()
  setJSON('sf_purchased', [...fired.slice(-49), token])
}

/** Premier focus dans le formulaire. */
export function initiateCheckout(): void {
  if (once.has('ic')) return
  once.add('ic')
  track('form_focus')
  track('checkout_initiate')
  pixel('InitiateCheckout', 'InitiateCheckout')
}

/** Démarrage sur une page : page_view, ViewContent, scroll 50 %, clics CTA, chargement différé des pixels. */
export function startTracking(opts: { viewContent?: boolean } = {}): void {
  const c = config()
  if (!c || noTrack()) return
  attribution()
  track('page_view')
  queuePixels(c)
  if (opts.viewContent) pixel('ViewContent', 'ViewContent')

  const onScroll = () => {
    const h = document.documentElement
    if ((window.scrollY + window.innerHeight) / Math.max(h.scrollHeight, 1) >= 0.5) {
      window.removeEventListener('scroll', onScroll)
      trackOnce('scroll_50')
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.('[data-cta]')
    if (el) track('cta_click', { position: el.getAttribute('data-cta') })
    const wa = (e.target as Element | null)?.closest?.('[data-wa]')
    if (wa) track('whatsapp_click')
  })

  // Pixels : après la première interaction, ou après un temps mort.
  const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const
  const go = () => {
    for (const ev of events) window.removeEventListener(ev, go)
    loadPixels()
  }
  for (const ev of events) window.addEventListener(ev, go, { passive: true, once: true })
  const idle = () => ((window as { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1)))(go, { timeout: 2000 })
  if (document.readyState === 'complete') setTimeout(idle, 3500)
  else window.addEventListener('load', () => setTimeout(idle, 3500), { once: true })
}
