/**
 * Popups marketing de la page de vente (rendu partagé avec l'aperçu du tableau de bord : @zuri/shared/popup-render).
 *
 * Chaque popup a un ou plusieurs moments (sortie, attente, défilement, inactivité, formulaire commencé,
 * hésitation, visiteur de retour, retour sur l'onglet). Un moment arrivé reste acquis pendant la visite :
 * « l'un ou l'autre » ouvre la popup au premier, « tous » quand chacun est arrivé.
 * Une seule popup par visite de page, dans l'ordre du vendeur ; jamais pour un client qui vient de commander.
 */
import { POPUP_CSS, POPUP_X_ICON, popupInnerHtml, popupRootClass, popupRootStyle, TAG_ICON, type RenderPopup, type RenderTexts } from '@zuri/shared/popup-render'
import { fullPhone } from './phone'
import { getJSON, getStr, setJSON, setStr } from './storage'
import { track } from './track'

type Trigger = { type: 'exit' | 'delay' | 'scroll' | 'idle' | 'form_abandon' | 'cta_no_order' | 'return_visit' | 'tab_return'; value: number }
type Popup = RenderPopup & {
  triggers: Trigger[]
  triggerMode: 'any' | 'all'
  autoApply: boolean
  countdownMinutes: number
  ctaUrl?: string
  teaser: boolean
  devices: 'all' | 'mobile' | 'desktop'
  frequency: 'session' | 'day' | 'week' | 'once'
}
type T = RenderTexts & { copied: string; applied: string }
type Cfg = { storeId: string; productId: string; slug: string; dial: string; wa: string | null; force: string | null; preview: boolean; popups: Popup[]; t: T }

const WINDOW: Record<Popup['frequency'], number> = { session: 0, day: 86400_000, week: 7 * 86400_000, once: Number.POSITIVE_INFINITY }
const pad = (n: number) => String(n).padStart(2, '0')
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function startMarketing(el: HTMLElement) {
  let cfg: Cfg
  try {
    cfg = JSON.parse(el.textContent ?? '') as Cfg
  } catch {
    return
  }
  const { t } = cfg
  const forced = cfg.force ? cfg.popups.find((p) => p.id === cfg.force) : undefined
  const ordered = Number(getStr(`sf_ordered_${cfg.storeId}`)) > Date.now() - 30 * 86400_000
  if (!forced && (ordered || !cfg.popups.length)) return

  const style = document.createElement('style')
  style.textContent = POPUP_CSS
  document.head.append(style)

  const mobile = () => window.matchMedia('(max-width: 767px)').matches
  const seenKey = (p: Popup) => `sf_mp_${p.id}`
  const canShow = (p: Popup) => {
    if (p.devices === 'mobile' && !mobile()) return false
    if (p.devices === 'desktop' && mobile()) return false
    if (p.frequency === 'session') return !getStr(seenKey(p), 'session')
    const last = Number(getStr(seenKey(p)))
    return !last || Date.now() - last > WINDOW[p.frequency]
  }
  const markSeen = (p: Popup) => {
    setStr(seenKey(p), String(Date.now()), 'session')
    if (p.frequency !== 'session') setStr(seenKey(p), String(Date.now()))
  }
  const send = (type: string, p: Popup) => {
    if (!cfg.preview) track(type, { popupId: p.id })
  }

  // ─── Compte à rebours : propre au visiteur, ou jusqu'à la fin du code ───
  function countdownEnd(p: Popup): number | null {
    if (p.countdown === 'promo_end') return p.promo?.endsAt ? Date.parse(p.promo.endsAt) : null
    if (p.countdown !== 'minutes') return null
    const key = `sf_mpc_${p.id}`
    let end = Number(getStr(key))
    if (!end) {
      end = Date.now() + p.countdownMinutes * 60_000
      setStr(key, String(end))
    }
    return end
  }
  const fmtLeft = (left: number) => {
    const d = Math.floor(left / 86400)
    const h = Math.floor((left % 86400) / 3600)
    const m = Math.floor((left % 3600) / 60)
    return d > 0 ? `${d} j ${pad(h)}:${pad(m)}` : `${h ? `${pad(h)}:` : ''}${pad(m)}:${pad(left % 60)}`
  }

  // ─── Affichage ───
  let shown = false
  let teaserEl: HTMLElement | null = null
  function show(p: Popup, again = false) {
    shown = true
    teaserEl?.remove()
    if (!again) {
      markSeen(p)
      send('popup_view', p)
    }
    const root = document.createElement('div')
    root.className = popupRootClass(p)
    root.setAttribute('style', popupRootStyle(p))
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', p.layout === 'side' ? 'false' : 'true')
    root.setAttribute('aria-labelledby', `mkp-title-${p.id}`)
    const end = countdownEnd(p)
    let stage: 'phone' | 'code' = p.collectPhone && p.promo && !getStr(`sf_mpl_${p.id}`) ? 'phone' : 'code'

    const render = () => {
      const left = end ? Math.floor((end - Date.now()) / 1000) : 0
      root.innerHTML = popupInnerHtml(p, t, { stage, dial: cfg.dial, cdText: left > 0 ? fmtLeft(left) : undefined })
      wire()
    }
    const close = (opts: { teaser?: boolean } = {}) => {
      root.classList.remove('mkp-in')
      setTimeout(() => root.remove(), 220)
      document.removeEventListener('keydown', onKey)
      if (opts.teaser !== false && p.teaser && p.promo) showTeaser(p)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        send('popup_close', p)
        close()
      }
    }
    const wire = () => {
      root.querySelectorAll('[data-close]').forEach((b) =>
        b.addEventListener('click', () => {
          send('popup_close', p)
          close()
        }),
      )
      root.querySelectorAll<HTMLElement>('[data-copy]').forEach((b) =>
        b.addEventListener('click', () => {
          navigator.clipboard?.writeText(b.dataset.copy!).catch(() => {})
          const lab = b.querySelector('.mkp-copy span')
          if (lab) {
            lab.textContent = t.copied
            setTimeout(() => (lab.textContent = t.copy), 1800)
          }
        }),
      )
      root.querySelector('[data-cta]')?.addEventListener('click', () => {
        send('popup_click', p)
        if (p.ctaAction === 'whatsapp' && cfg.wa) {
          window.open(cfg.wa, '_blank', 'noopener')
          return close()
        }
        if (p.ctaAction === 'url' && p.ctaUrl) {
          location.href = p.ctaUrl
          return
        }
        if (p.ctaAction === 'close') return close()
        const applied = applyCode(p)
        close({ teaser: !applied })
        document.getElementById('commander')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      // Numéro WhatsApp avant de voir le code : il rejoint les paniers à relancer.
      const form = root.querySelector<HTMLFormElement>('.mkp-phone')
      form?.addEventListener('submit', (e) => {
        e.preventDefault()
        const input = form.querySelector('input')!
        const full = fullPhone(cfg.dial, input.value)
        const err = form.querySelector<HTMLElement>('.mkp-err')!
        if (!full) {
          err.hidden = false
          input.focus()
          return
        }
        if (!cfg.preview) {
          fetch('/api/v1/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storeSlug: cfg.slug, productId: cfg.productId, phone: full, url: location.href.split('#')[0]!.slice(0, 2000) }), keepalive: true }).catch(() => {})
          send('popup_lead', p)
        }
        setStr(`sf_mpl_${p.id}`, '1')
        const b = getJSON<Record<string, string>>('sf_buyer') ?? {}
        if (!b.phone) setJSON('sf_buyer', { ...b, phone: input.value.trim(), dial: cfg.dial })
        stage = 'code'
        render()
      })
    }

    render()
    document.body.append(root)
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('mkp-in')))
    root.querySelector<HTMLElement>(stage === 'phone' ? 'input' : '.mkp-cta')?.focus({ preventScroll: true })
    if (end) {
      const tick = () => {
        if (!root.isConnected) return
        const left = Math.floor((end - Date.now()) / 1000)
        const box = root.querySelector<HTMLElement>('.mkp-cd')
        if (box) {
          box.hidden = left <= 0
          const out = box.querySelector('.mkp-cd-time')
          if (out && left > 0) out.textContent = fmtLeft(left)
        }
        if (left > 0) setTimeout(tick, 1000)
      }
      tick()
    }
  }

  function applyCode(p: Popup) {
    if (!p.promo || !p.autoApply) return false
    setStr('sf_promo_pending', p.promo.code, 'session')
    window.dispatchEvent(new CustomEvent('zuri:promo', { detail: p.promo.code }))
    return true
  }

  // Rappel du code dans un coin après fermeture : un clic rouvre la popup.
  function showTeaser(p: Popup) {
    if (!p.promo) return
    teaserEl?.remove()
    const b = document.createElement('div')
    b.className = `mkp-teaser mkp-t-${p.theme}`
    const revealed = !p.collectPhone || Boolean(getStr(`sf_mpl_${p.id}`))
    b.innerHTML = `<button type="button" class="mkp-teaser-open">${TAG_ICON}<span>${esc(p.promo.label)} · ${revealed ? `<b>${esc(p.promo.code)}</b>` : esc(t.reveal)}</span></button><button type="button" class="mkp-teaser-x" aria-label="${esc(t.close)}">${POPUP_X_ICON}</button>`
    b.querySelector('.mkp-teaser-open')!.addEventListener('click', () => show(p, true))
    b.querySelector('.mkp-teaser-x')!.addEventListener('click', () => b.remove())
    document.body.append(b)
    teaserEl = b
  }

  // ─── Test depuis l'espace vendeur (?zuri_popup=ID) : ouverture immédiate ───
  if (forced) {
    setTimeout(() => show(forced, true), 500)
    return
  }

  // ─── Moments acquis pendant la visite ───
  const openedAt = Date.now()
  const hit = new Set<string>() // `${type}:${value}`
  let submitted = false
  let formStarted = false
  let lastFormInput = 0
  let lastActivity = Date.now()
  let ctaAt = 0
  let pct = 0

  const key = (tr: Trigger) => `${tr.type}:${tr.value}`
  const evaluate = () => {
    if (shown || submitted) return
    for (const p of cfg.popups) {
      if (!canShow(p)) continue
      const ok = p.triggerMode === 'all' ? p.triggers.every((tr) => hit.has(key(tr))) : p.triggers.some((tr) => hit.has(key(tr)))
      if (ok) return show(p)
    }
  }
  /** Marque comme arrivés les moments d'un type qui remplissent la condition. */
  const reach = (type: Trigger['type'], cond: (tr: Trigger) => boolean = () => true) => {
    let changed = false
    for (const p of cfg.popups)
      for (const tr of p.triggers)
        if (tr.type === type && !hit.has(key(tr)) && cond(tr)) {
          hit.add(key(tr))
          changed = true
        }
    if (changed) evaluate()
  }
  const has = (type: Trigger['type']) => cfg.popups.some((p) => p.triggers.some((tr) => tr.type === type))

  // Signaux de la page.
  const box = document.getElementById('commander')
  box?.addEventListener('input', () => {
    formStarted = true
    lastFormInput = Date.now()
  })
  box?.addEventListener('submit', () => (submitted = true), true)
  document.addEventListener('click', (e) => {
    const tg = e.target as HTMLElement | null
    if (tg?.closest?.('[data-cta]') && !tg.closest('.mkp')) ctaAt ||= Date.now()
  })
  if (box && 'IntersectionObserver' in window) new IntersectionObserver((es) => es.some((x) => x.isIntersecting) && (ctaAt ||= Date.now()), { threshold: 0.3 }).observe(box)
  for (const ev of ['mousemove', 'keydown', 'touchstart', 'scroll'] as const) window.addEventListener(ev, () => (lastActivity = Date.now()), { passive: true })

  // Sortie : souris qui file vers le haut (ordinateur), remontée rapide après lecture (téléphone).
  const exitIntent = () => {
    if (Date.now() - openedAt < 5000) return
    if (formStarted && !submitted) reach('form_abandon')
    reach('exit')
  }
  if (has('exit') || has('form_abandon')) {
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && e.clientY <= 0) exitIntent()
    })
    let lastY = window.scrollY
    let lastT = performance.now()
    let maxY = 0
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY
        const now = performance.now()
        maxY = Math.max(maxY, y)
        const speed = (lastY - y) / Math.max(1, now - lastT)
        if (mobile() && maxY > window.innerHeight * 1.5 && speed > 1.6 && y < maxY - 300) exitIntent()
        lastY = y
        lastT = now
      },
      { passive: true },
    )
  }
  if (has('scroll'))
    window.addEventListener(
      'scroll',
      () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        pct = Math.max(pct, max > 0 ? (window.scrollY / max) * 100 : 0)
        reach('scroll', (tr) => pct >= tr.value)
      },
      { passive: true },
    )
  if (has('tab_return')) {
    let hiddenAt = 0
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 4000) reach('tab_return')
    })
  }
  let returning = false
  if (has('return_visit')) {
    const k = `sf_visits_${cfg.productId}`
    if (!getStr(k, 'session')) {
      setStr(k, '1', 'session')
      setStr(k, String(Number(getStr(k)) + 1))
    }
    returning = Number(getStr(k)) >= 2
  }
  // Moments liés au temps : vérifiés chaque seconde.
  setInterval(() => {
    if (shown || document.hidden) return
    const now = Date.now()
    const onPage = (now - openedAt) / 1000
    reach('delay', (tr) => onPage >= Math.max(1, tr.value))
    reach('idle', (tr) => now - lastActivity >= Math.max(3, tr.value) * 1000)
    if (formStarted && !submitted) reach('form_abandon', (tr) => now - lastFormInput >= Math.max(5, tr.value) * 1000)
    if (ctaAt && !formStarted) reach('cta_no_order', (tr) => now - ctaAt >= Math.max(5, tr.value) * 1000)
    if (returning) reach('return_visit', (tr) => onPage >= Math.max(2, tr.value))
  }, 1000)
}
