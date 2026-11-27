/**
 * Script de la page de vente (hors formulaire) : quelques centaines d'octets.
 * Barre CTA collante, vidéo légère, compte à rebours persistant, compteur de visiteurs,
 * suivi, et pop-up de ventes réelles chargé en différé.
 */
import { getStr, setStr } from './storage'
import { formatCountdown } from '@zuri/shared/time'
import { startTracking } from './track'

startTracking({ viewContent: true })

// ─── Bouton d'achat collant : déclencheur réglable (après l'image, tout de suite, ou à X % du défilement) ───
const sticky = document.getElementById('sf-sticky')
const form = document.getElementById('commander')
if (sticky) {
  const trigger = sticky.dataset.trigger ?? 'after_hero'
  const percent = Number(sticky.dataset.percent ?? 25)
  const hideNearForm = sticky.dataset.hideNearForm !== '0'
  const after = document.querySelector('[data-sticky-after]') ?? document.querySelector('.hero')
  let passed = trigger === 'immediate' || (trigger === 'after_hero' && !after)
  let formVisible = false
  const update = () => {
    const on = passed && !(hideNearForm && formVisible)
    sticky.classList.toggle('show', on)
    sticky.setAttribute('aria-hidden', String(!on))
    document.body.classList.toggle('sticky-on', on && !sticky.classList.contains('sticky-top'))
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === after && trigger === 'after_hero') passed = !e.isIntersecting && e.boundingClientRect.top < 0
        else if (e.target === form) formVisible = e.isIntersecting
      }
      update()
    })
    if (after && trigger === 'after_hero') io.observe(after)
    if (form) io.observe(form)
  }
  if (trigger === 'scroll') {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      passed = max <= 0 || (window.scrollY / max) * 100 >= percent
      update()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }
  update()
}

// ─── Vidéo : vignette, puis iframe au clic seulement ───
document.addEventListener('click', (e) => {
  const box = (e.target as Element | null)?.closest?.<HTMLElement>('[data-video]')
  if (!box || box.querySelector('iframe')) return
  const f = document.createElement('iframe')
  f.src = box.dataset.video!
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  f.title = 'Vidéo'
  box.replaceChildren(f)
})

// ─── Compte à rebours ───
// visitor : même échéance pour un visiteur (il ne repart pas à chaque visite) ;
// daily : jusqu'à minuit, chaque jour ; date : jusqu'à la date choisie par le vendeur.
// Échéance passée : l'élément disparaît, on n'invente pas une nouvelle offre.
const pad = (n: number) => String(n).padStart(2, '0')
document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((cd) => {
  const mode = cd.dataset.mode ?? 'visitor'
  const endOf = (): number => {
    if (mode === 'date') return Date.parse(cd.dataset.ends ?? '') || 0
    if (mode === 'daily') {
      const d = new Date()
      d.setHours(24, 0, 0, 0)
      return d.getTime()
    }
    const key = `sf_cd_${cd.dataset.pid}`
    let end = Number(getStr(key))
    if (!end || Number.isNaN(end)) {
      end = Date.now() + Number(cd.dataset.countdown) * 60_000
      setStr(key, String(end))
    }
    return end
  }
  let end = endOf()
  const clock = cd.querySelector('.cd-time:not(.cd-blocks)')
  const boxes = cd.querySelectorAll('.cd-box b')
  const tick = () => {
    if (mode === 'daily' && end - Date.now() <= 0) end = endOf()
    const left = Math.floor((end - Date.now()) / 1000)
    if (left <= 0) {
      cd.hidden = true
      return
    }
    // Cases : heures (jours compris), minutes, secondes ; texte : toujours avec les unités.
    const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map(pad)
    if (clock) clock.textContent = formatCountdown(left, document.documentElement.lang === 'en' ? 'en' : 'fr')
    boxes.forEach((b, i) => (b.textContent = parts[i]!))
    cd.hidden = false
    setTimeout(tick, 1000)
  }
  tick()
})

// ─── Visiteurs : légère variation autour de la valeur configurée ───
document.querySelectorAll<HTMLElement>('[data-viewers]').forEach((vw) => {
  if (vw.dataset.vary === '0') return
  const base = Number(vw.dataset.viewers)
  const tpl = vw.dataset.tpl
  const txt = vw.querySelector('[data-vtext]')!
  let n = base
  setInterval(() => {
    n = Math.max(Math.round(base * 0.7), Math.min(Math.round(base * 1.4) + 1, n + Math.round(Math.random() * 4) - 2))
    txt.textContent = tpl ? tpl.replace(/\{n\}/gi, String(n)) : (txt.textContent ?? '').replace(/\d+/, String(n))
  }, 8000)
})

// ─── Popups marketing : moteur chargé dès que la page est prête (la sortie peut arriver tôt) ───
const mkt = document.getElementById('sf-mkt')
if (mkt) {
  const go = () => import('./marketing').then((m) => m.startMarketing(mkt))
  if (document.readyState === 'complete') setTimeout(go, 300)
  else window.addEventListener('load', () => setTimeout(go, 300), { once: true })
}

// ─── Pop-up de ventes réelles : chargé après le temps mort ───
const popup = document.getElementById('sf-popup')
if (popup) {
  const load = () => import('./popup').then((m) => m.startPopup(popup))
  window.addEventListener('load', () => setTimeout(load, 6000), { once: true })
}
