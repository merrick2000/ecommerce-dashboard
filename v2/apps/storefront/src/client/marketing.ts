/**
 * Popups marketing de la page de vente.
 * Une seule popup par visite de page, la première (dans l'ordre du vendeur) dont le déclencheur arrive :
 * sortie, attente, défilement, inactivité, formulaire commencé, hésitation, visiteur de retour, retour sur l'onglet.
 * Jamais pour un client qui vient de commander. Fréquence respectée par visiteur (session, jour, semaine, une fois).
 */
import { fullPhone } from './phone'
import { getJSON, getStr, setJSON, setStr } from './storage'
import { track } from './track'

type Promo = { code: string; label: string; endsAt: string | null; minText: string | null }
type Popup = {
  id: string
  trigger: 'exit' | 'delay' | 'scroll' | 'idle' | 'form_abandon' | 'cta_no_order' | 'return_visit' | 'tab_return'
  value: number
  title: string
  text?: string
  image: 'none' | 'product' | 'custom'
  imageSrc: string | null
  promo: Promo | null
  autoApply: boolean
  countdown: 'none' | 'minutes' | 'promo_end'
  countdownMinutes: number
  collectPhone: boolean
  ctaText?: string
  ctaAction: 'order' | 'whatsapp' | 'close' | 'url'
  ctaUrl?: string
  dismissText?: string
  layout: 'center' | 'bottom' | 'side'
  theme: 'light' | 'dark' | 'accent'
  teaser: boolean
  devices: 'all' | 'mobile' | 'desktop'
  frequency: 'session' | 'day' | 'week' | 'once'
}
type T = { cta: string; ctaOrder: string; dismiss: string; copy: string; copied: string; endsIn: string; phoneLabel: string; phonePh: string; reveal: string; phoneBad: string; applied: string; close: string; yourCode: string }
type Cfg = { storeId: string; productId: string; slug: string; dial: string; wa: string | null; force: string | null; preview: boolean; popups: Popup[]; t: T }

const WINDOW: Record<Popup['frequency'], number> = { session: 0, day: 86400_000, week: 7 * 86400_000, once: Number.POSITIVE_INFINITY }
const pad = (n: number) => String(n).padStart(2, '0')
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const X_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
const COPY_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
const TAG_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/></svg>'

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

  let shown = false
  const openedAt = Date.now()
  const fire = (trigger: Popup['trigger']) => {
    if (shown) return
    // Formulaire envoyé : on ne dérange plus.
    if (submitted) return
    const p = cfg.popups.find((x) => x.trigger === trigger && canShow(x))
    if (p) show(p)
  }

  // ─── Affichage ───
  let teaserEl: HTMLElement | null = null
  function show(p: Popup, again = false) {
    shown = true
    teaserEl?.remove()
    if (!again) {
      markSeen(p)
      send('popup_view', p)
    }
    const phoneDone = Boolean(getStr(`sf_mpl_${p.id}`))
    const needPhone = p.collectPhone && p.promo && !phoneDone
    const root = document.createElement('div')
    root.className = `mkp mkp-${p.layout} mkp-t-${p.theme}`
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', p.layout === 'side' ? 'false' : 'true')
    root.setAttribute('aria-labelledby', `mkp-title-${p.id}`)
    const cta = p.ctaText || (p.ctaAction === 'order' ? t.ctaOrder : t.cta)
    root.innerHTML = `
      ${p.layout !== 'side' ? '<div class="mkp-backdrop" data-close></div>' : ''}
      <div class="mkp-card">
        <button type="button" class="mkp-x" data-close aria-label="${esc(t.close)}">${X_ICON}</button>
        ${p.imageSrc && p.image !== 'none' ? `<img class="mkp-img" src="${esc(p.imageSrc)}" alt="" width="640" height="360" />` : ''}
        <div class="mkp-body">
          ${p.promo ? `<p class="mkp-badge">${TAG_ICON}<span>${esc(p.promo.label)}</span></p>` : ''}
          <h2 class="mkp-title" id="mkp-title-${p.id}">${esc(p.title)}</h2>
          ${p.text ? `<p class="mkp-text">${esc(p.text)}</p>` : ''}
          <div class="mkp-cd" hidden><span>${esc(t.endsIn)}</span> <b class="mkp-cd-time">--:--</b></div>
          ${
            p.promo
              ? needPhone
                ? `<form class="mkp-phone" novalidate>
                    <label for="mkp-ph-${p.id}">${esc(t.phoneLabel)}</label>
                    <div class="mkp-row"><span class="mkp-dial">+${esc(cfg.dial)}</span><input id="mkp-ph-${p.id}" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(t.phonePh)}" required /></div>
                    <p class="mkp-err" hidden>${esc(t.phoneBad)}</p>
                    <button type="submit" class="mkp-cta">${esc(t.reveal)}</button>
                  </form>`
                : codeBlock(p)
              : ''
          }
          ${needPhone ? '' : `<button type="button" class="mkp-cta" data-cta>${esc(cta)}</button>`}
          <button type="button" class="mkp-dismiss" data-close>${esc(p.dismissText || t.dismiss)}</button>
        </div>
      </div>`
    document.body.append(root)
    requestAnimationFrame(() => root.classList.add('mkp-in'))
    root.querySelector<HTMLElement>(needPhone ? 'input' : '.mkp-x')?.focus({ preventScroll: true })

    const close = (opts: { teaser?: boolean } = {}) => {
      root.classList.remove('mkp-in')
      setTimeout(() => root.remove(), 200)
      document.removeEventListener('keydown', onKey)
      if (opts.teaser !== false && p.teaser && p.promo) showTeaser(p)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        send('popup_close', p)
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    root.querySelectorAll('[data-close]').forEach((b) =>
      b.addEventListener('click', () => {
        send('popup_close', p)
        close()
      }),
    )
    wireCode(root)
    const ctaBtn = () => root.querySelector<HTMLElement>('[data-cta]')
    const onCta = () => {
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
      // Commander : code appliqué au formulaire, puis on y descend.
      const applied = applyCode(p)
      close({ teaser: !applied })
      document.getElementById('commander')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    ctaBtn()?.addEventListener('click', onCta)

    // Numéro WhatsApp avant de voir le code : il rejoint les paniers à relancer.
    const form = root.querySelector<HTMLFormElement>('.mkp-phone')
    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const input = form.querySelector('input')!
      const full = fullPhone(cfg.dial, input.value)
      const err = form.querySelector<HTMLElement>('.mkp-err')!
      if (!full) {
        err.hidden = false
        input.focus()
        return
      }
      err.hidden = true
      form.querySelector('button')!.setAttribute('disabled', '')
      if (!cfg.preview) {
        fetch('/api/v1/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storeSlug: cfg.slug, productId: cfg.productId, phone: full, url: location.href.split('#')[0]!.slice(0, 2000) }), keepalive: true }).catch(() => {})
        send('popup_lead', p)
      }
      setStr(`sf_mpl_${p.id}`, '1')
      // Le formulaire de commande reprend ce numéro.
      const b = getJSON<Record<string, string>>('sf_buyer') ?? {}
      if (!b.phone) setJSON('sf_buyer', { ...b, phone: input.value.trim(), dial: cfg.dial })
      const wrap = document.createElement('div')
      wrap.innerHTML = codeBlock(p) + `<button type="button" class="mkp-cta" data-cta>${esc(cta)}</button>`
      form.replaceWith(...Array.from(wrap.children))
      wireCode(root)
      ctaBtn()?.addEventListener('click', onCta)
    })

    startCountdown(p, root)
  }

  function codeBlock(p: Popup) {
    if (!p.promo) return ''
    return `<div class="mkp-code">
        <span class="mkp-code-label">${esc(t.yourCode)}</span>
        <button type="button" class="mkp-code-btn" data-copy="${esc(p.promo.code)}" aria-label="${esc(t.copy)} ${esc(p.promo.code)}">
          <b>${esc(p.promo.code)}</b><span class="mkp-copy">${COPY_ICON}<span>${esc(t.copy)}</span></span>
        </button>
        ${p.promo.minText ? `<small>${esc(p.promo.minText)}</small>` : ''}
      </div>`
  }
  function wireCode(root: HTMLElement) {
    root.querySelectorAll<HTMLElement>('[data-copy]').forEach((b) => {
      if (b.dataset.wired) return
      b.dataset.wired = '1'
      b.addEventListener('click', () => {
        const code = b.dataset.copy!
        navigator.clipboard?.writeText(code).catch(() => {})
        const lab = b.querySelector('.mkp-copy span')
        if (lab) {
          lab.textContent = t.copied
          setTimeout(() => (lab.textContent = t.copy), 1800)
        }
      })
    })
  }
  function applyCode(p: Popup) {
    if (!p.promo || !p.autoApply) return false
    setStr('sf_promo_pending', p.promo.code, 'session')
    window.dispatchEvent(new CustomEvent('zuri:promo', { detail: p.promo.code }))
    return true
  }

  // Compte à rebours : propre au visiteur (il ne repart pas), ou jusqu'à la fin du code.
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
  function startCountdown(p: Popup, root: HTMLElement) {
    const end = countdownEnd(p)
    const box = root.querySelector<HTMLElement>('.mkp-cd')
    const out = root.querySelector('.mkp-cd-time')
    if (!end || !box || !out) return
    const tick = () => {
      if (!root.isConnected) return
      const left = Math.floor((end - Date.now()) / 1000)
      if (left <= 0) {
        box.hidden = true
        return
      }
      const d = Math.floor(left / 86400)
      const h = Math.floor((left % 86400) / 3600)
      out.textContent = d > 0 ? `${d} j ${pad(h)}:${pad(Math.floor((left % 3600) / 60))}` : `${h ? `${pad(h)}:` : ''}${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`
      box.hidden = false
      setTimeout(tick, 1000)
    }
    tick()
  }

  // Rappel du code dans un coin après fermeture : un clic rouvre la popup.
  function showTeaser(p: Popup) {
    if (!p.promo) return
    teaserEl?.remove()
    const b = document.createElement('div')
    b.className = `mkp-teaser mkp-t-${p.theme}`
    // Code pas encore débloqué (numéro demandé) : la pastille invite à le voir, sans le dévoiler.
    const revealed = !p.collectPhone || Boolean(getStr(`sf_mpl_${p.id}`))
    b.innerHTML = `<button type="button" class="mkp-teaser-open">${TAG_ICON}<span>${esc(p.promo.label)} · ${revealed ? `<b>${esc(p.promo.code)}</b>` : esc(t.reveal)}</span></button><button type="button" class="mkp-teaser-x" aria-label="${esc(t.close)}">${X_ICON}</button>`
    b.querySelector('.mkp-teaser-open')!.addEventListener('click', () => show(p, true))
    b.querySelector('.mkp-teaser-x')!.addEventListener('click', () => b.remove())
    document.body.append(b)
    teaserEl = b
  }

  // ─── Test depuis l'espace vendeur (?zuri_popup=ID) : ouverture immédiate ───
  if (forced) {
    setTimeout(() => show(forced, true), 600)
    return
  }

  // ─── Signaux de la page ───
  let submitted = false
  let formStarted = false
  let lastFormInput = 0
  let lastActivity = Date.now()
  let ctaAt = 0
  const box = document.getElementById('commander')
  box?.addEventListener('input', () => {
    formStarted = true
    lastFormInput = Date.now()
  })
  box?.addEventListener('submit', () => (submitted = true), true)
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('[data-cta]') && !(e.target as HTMLElement).closest('.mkp')) ctaAt ||= Date.now()
  })
  if (box && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.some((x) => x.isIntersecting) && (ctaAt ||= Date.now()), { threshold: 0.3 }).observe(box)
  }
  for (const ev of ['mousemove', 'keydown', 'touchstart', 'scroll'] as const) window.addEventListener(ev, () => (lastActivity = Date.now()), { passive: true })

  const has = (tr: Popup['trigger']) => cfg.popups.some((p) => p.trigger === tr)
  const exitIntent = () => {
    if (Date.now() - openedAt < 5000) return
    // Formulaire commencé puis abandonné : sa popup passe en premier.
    if (formStarted && !submitted) fire('form_abandon')
    fire('exit')
  }

  // Sortie : souris qui file vers le haut (ordinateur), remontée rapide après lecture (téléphone).
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

  for (const p of cfg.popups) {
    if (p.trigger === 'delay') setTimeout(() => fire('delay'), Math.max(1, p.value) * 1000)
  }
  if (has('scroll')) {
    window.addEventListener(
      'scroll',
      () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0
        const p = cfg.popups.find((x) => x.trigger === 'scroll' && pct >= x.value && canShow(x))
        if (p && !shown && !submitted) show(p)
      },
      { passive: true },
    )
  }
  if (has('return_visit')) {
    const k = `sf_visits_${cfg.productId}`
    if (!getStr(k, 'session')) {
      setStr(k, '1', 'session')
      setStr(k, String(Number(getStr(k)) + 1))
    }
    if (Number(getStr(k)) >= 2) {
      const p = cfg.popups.find((x) => x.trigger === 'return_visit')!
      setTimeout(() => fire('return_visit'), Math.max(2, p.value) * 1000)
    }
  }
  if (has('tab_return')) {
    let hiddenAt = 0
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 4000) fire('tab_return')
    })
  }
  if (has('idle') || has('form_abandon') || has('cta_no_order')) {
    setInterval(() => {
      if (shown || document.hidden) return
      const now = Date.now()
      for (const p of cfg.popups) {
        if (!canShow(p)) continue
        const ok =
          (p.trigger === 'idle' && now - lastActivity >= p.value * 1000) ||
          (p.trigger === 'form_abandon' && formStarted && !submitted && now - lastFormInput >= Math.max(5, p.value) * 1000) ||
          (p.trigger === 'cta_no_order' && ctaAt > 0 && !formStarted && now - ctaAt >= Math.max(5, p.value) * 1000)
        if (ok) return show(p)
      }
    }, 1000)
  }
}
