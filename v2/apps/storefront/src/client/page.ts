/**
 * Script de la page de vente (hors formulaire) : quelques centaines d'octets.
 * Barre CTA collante, vidéo légère, compte à rebours persistant, compteur de visiteurs,
 * suivi, et pop-up de ventes réelles chargé en différé.
 */
import { getStr, setStr } from './storage'
import { startTracking } from './track'

startTracking({ viewContent: true })

// ─── Barre CTA mobile : visible quand le bloc prix/hero est passé et que le formulaire n'est pas à l'écran ───
const sticky = document.getElementById('sf-sticky')
const after = document.querySelector('[data-sticky-after]') ?? document.querySelector('.hero')
const form = document.getElementById('commander')
if (sticky && 'IntersectionObserver' in window) {
  let passed = !after
  let formVisible = false
  const update = () => {
    const on = passed && !formVisible
    sticky.classList.toggle('show', on)
    sticky.setAttribute('aria-hidden', String(!on))
    document.body.classList.toggle('sticky-on', on)
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === after) passed = !e.isIntersecting && e.boundingClientRect.top < 0
      else if (e.target === form) formVisible = e.isIntersecting
    }
    update()
  })
  if (after) io.observe(after)
  if (form) io.observe(form)
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

// ─── Compte à rebours : même échéance pour un visiteur, il ne repart pas à chaque visite ───
const cd = document.querySelector<HTMLElement>('[data-countdown]')
if (cd) {
  const key = `sf_cd_${cd.dataset.pid}`
  let end = Number(getStr(key))
  if (!end || Number.isNaN(end)) {
    end = Date.now() + Number(cd.dataset.countdown) * 60_000
    setStr(key, String(end))
  }
  const out = cd.querySelector('.cd-time')!
  const pad = (n: number) => String(n).padStart(2, '0')
  const tick = () => {
    const left = Math.floor((end - Date.now()) / 1000)
    if (left <= 0) {
      cd.hidden = true // Échéance passée : on n'invente pas une nouvelle offre.
      return
    }
    out.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`
    cd.hidden = false
    setTimeout(tick, 1000)
  }
  tick()
}

// ─── Visiteurs : légère variation autour de la valeur configurée ───
const vw = document.querySelector<HTMLElement>('[data-viewers]')
if (vw) {
  const base = Number(vw.dataset.viewers)
  const txt = vw.querySelector('[data-vtext]')!
  let n = base
  setInterval(() => {
    n = Math.max(Math.round(base * 0.7), Math.min(Math.round(base * 1.4) + 1, n + Math.round(Math.random() * 4) - 2))
    txt.textContent = (txt.textContent ?? '').replace(/\d+/, String(n))
  }, 8000)
}

// ─── Pop-up de ventes réelles : chargé après le temps mort ───
const popup = document.getElementById('sf-popup')
if (popup) {
  const load = () => import('./popup').then((m) => m.startPopup(popup))
  window.addEventListener('load', () => setTimeout(load, 6000), { once: true })
}
