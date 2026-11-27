/**
 * Rendu des popups marketing, partagé par la page de vente (client/marketing.ts) et l'aperçu
 * du tableau de bord : ce que le vendeur voit est exactement ce que voit le client.
 * Aucune dépendance au navigateur : des chaînes HTML et CSS.
 */
import type { PopupDesign } from './index'

export type RenderPromo = { code: string; label: string; endsAt: string | null; minText: string | null }
export type RenderPopup = {
  id: string
  title: string
  text?: string
  image: 'none' | 'product' | 'custom'
  imageSrc: string | null
  promo: RenderPromo | null
  collectPhone: boolean
  countdown: 'none' | 'minutes' | 'promo_end'
  ctaText?: string
  ctaAction: 'order' | 'whatsapp' | 'close' | 'url'
  dismissText?: string
  layout: 'center' | 'bottom' | 'side'
  theme: 'light' | 'dark' | 'accent'
  design: PopupDesign
}
export type RenderTexts = { cta: string; ctaOrder: string; dismiss: string; copy: string; endsIn: string; phoneLabel: string; phonePh: string; reveal: string; phoneBad: string; close: string; yourCode: string }

export const POPUP_TEXTS: Record<'fr' | 'en', RenderTexts & { copied: string; applied: string }> = {
  fr: { cta: 'Continuer', ctaOrder: 'J’en profite', dismiss: 'Non merci', copy: 'Copier', copied: 'Copié', endsIn: 'Offre valable encore', phoneLabel: 'Votre numéro WhatsApp', phonePh: 'Numéro de téléphone', reveal: 'Voir mon code', phoneBad: 'Entrez un numéro valide', applied: 'Code appliqué', close: 'Fermer', yourCode: 'Votre code' },
  en: { cta: 'Continue', ctaOrder: 'Claim my offer', dismiss: 'No thanks', copy: 'Copy', copied: 'Copied', endsIn: 'Offer ends in', phoneLabel: 'Your WhatsApp number', phonePh: 'Phone number', reveal: 'Show my code', phoneBad: 'Please enter a valid number', applied: 'Code applied', close: 'Close', yourCode: 'Your code' },
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const X_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
const COPY_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
export const TAG_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/></svg>'
export { X_ICON as POPUP_X_ICON }

/** CSS libre du vendeur : jamais de balise, d'import ni de script. */
export const safePopupCss = (css?: string) =>
  (css ?? '')
    .replace(/<\/?[a-z!][^>]*>?/gi, '')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 4000)

/** Classes de la racine (toutes les options de design passent par des classes et des variables). */
export function popupRootClass(p: RenderPopup) {
  const d = p.design
  const img = p.image !== 'none' && p.imageSrc ? d.imagePosition : 'none'
  return `mkp mkp-${p.layout} mkp-t-${p.theme} mkp-w-${d.width} mkp-a-${d.align} mkp-ts-${d.titleSize} mkp-btn-${d.btnShape} mkp-anim-${d.animation} mkp-img-${img} mkp-fit-${d.imageFit} mkp-m-${d.mobileLayout}`
}
export function popupRootStyle(p: RenderPopup) {
  const d = p.design
  const v: string[] = [`--mk-radius:${d.radius}px`, `--mk-overlay:${d.overlay / 100}`]
  if (d.bg) v.push(`--mk-bg:${d.bg}`)
  if (d.fg) v.push(`--mk-fg:${d.fg}`, `--mk-muted:color-mix(in srgb, ${d.fg} 72%, transparent)`)
  if (d.btnBg) v.push(`--mk-cta-bg:${d.btnBg}`)
  if (d.btnFg) v.push(`--mk-cta-fg:${d.btnFg}`)
  if (d.badgeBg) v.push(`--mk-soft:${d.badgeBg}`)
  return v.join(';')
}

/**
 * Contenu de la popup. stage = phone : le code est caché derrière le numéro WhatsApp.
 * cdText : texte initial du compte à rebours (rempli ensuite par le script de la page).
 */
export function popupInnerHtml(p: RenderPopup, t: RenderTexts, opts: { stage: 'phone' | 'code'; dial: string; cdText?: string }) {
  const d = p.design
  const showImg = p.image !== 'none' && p.imageSrc
  const bgImg = showImg && d.imagePosition === 'background'
  const cta = p.ctaText || (p.ctaAction === 'order' ? t.ctaOrder : t.cta)
  const phone = opts.stage === 'phone' && p.collectPhone && p.promo
  const code = p.promo
    ? phone
      ? `<form class="mkp-phone" id="mkp-f-${p.id}" novalidate>
          <label for="mkp-ph-${p.id}">${esc(t.phoneLabel)}</label>
          <div class="mkp-row"><span class="mkp-dial">+${esc(opts.dial)}</span><input id="mkp-ph-${p.id}" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(t.phonePh)}" required /></div>
          <p class="mkp-err" hidden>${esc(t.phoneBad)}</p>
        </form>`
      : `<div class="mkp-code">
          <span class="mkp-code-label">${esc(t.yourCode)}</span>
          <button type="button" class="mkp-code-btn" data-copy="${esc(p.promo.code)}" aria-label="${esc(t.copy)} ${esc(p.promo.code)}">
            <b>${esc(p.promo.code)}</b><span class="mkp-copy">${COPY_ICON}<span>${esc(t.copy)}</span></span>
          </button>
          ${p.promo.minText ? `<small>${esc(p.promo.minText)}</small>` : ''}
        </div>`
    : ''
  const css = safePopupCss(d.customCss)
  return `${p.layout !== 'side' ? '<div class="mkp-backdrop" data-close></div>' : ''}
    <div class="mkp-card"${bgImg ? ` style="background-image:linear-gradient(rgb(0 0 0 / .55), rgb(0 0 0 / .6)), url('${esc(p.imageSrc!).replace(/'/g, '%27')}')"` : ''}>
      ${d.showClose ? `<button type="button" class="mkp-x" data-close aria-label="${esc(t.close)}">${X_ICON}</button>` : ''}
      ${showImg && !bgImg ? `<div class="mkp-media"><img class="mkp-img" src="${esc(p.imageSrc!)}" alt="" /></div>` : ''}
      <div class="mkp-main">
        <div class="mkp-scroll"><div class="mkp-body">
          ${p.promo && d.showBadge ? `<p class="mkp-badge">${TAG_ICON}<span>${esc(p.promo.label)}</span></p>` : ''}
          <h2 class="mkp-title" id="mkp-title-${p.id}">${esc(p.title)}</h2>
          ${p.text ? `<p class="mkp-text">${esc(p.text)}</p>` : ''}
          ${p.countdown !== 'none' ? `<div class="mkp-cd"${opts.cdText ? '' : ' hidden'}><span>${esc(t.endsIn)}</span> <b class="mkp-cd-time">${esc(opts.cdText ?? '')}</b></div>` : ''}
          ${code}
        </div></div>
        <div class="mkp-actions">
          ${phone ? `<button type="submit" form="mkp-f-${p.id}" class="mkp-cta">${esc(t.reveal)}</button>` : `<button type="button" class="mkp-cta" data-cta>${esc(cta)}</button>`}
          ${d.showDismiss ? `<button type="button" class="mkp-dismiss" data-close>${esc(p.dismissText || t.dismiss)}</button>` : ''}
        </div>
      </div>
      ${css ? `<style>${css}</style>` : ''}
    </div>`
}

/** Feuille de style des popups (injectée une fois par la page de vente, et dans l'aperçu). */
export const POPUP_CSS = `
.mkp{--mk-bg:var(--page,#fff);--mk-fg:var(--fg,#111827);--mk-muted:var(--muted,#6b7280);--mk-line:var(--line,#e5e7eb);--mk-cta-bg:var(--accent,#f59e0b);--mk-cta-fg:var(--on-accent,#111);--mk-soft:color-mix(in srgb,var(--accent,#f59e0b) 16%,transparent);--mk-radius:18px;--mk-overlay:.5;--mk-w:440px;position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:16px;pointer-events:none;font-family:inherit}
.mkp *{box-sizing:border-box}
.mkp-t-dark{--mk-bg:#111827;--mk-fg:#f9fafb;--mk-muted:#cbd5e1;--mk-line:rgb(255 255 255 / .18);--mk-soft:rgb(255 255 255 / .12)}
.mkp-t-accent{--mk-bg:var(--accent,#f59e0b);--mk-fg:var(--on-accent,#111);--mk-muted:color-mix(in srgb,var(--on-accent,#111) 75%,transparent);--mk-line:color-mix(in srgb,var(--on-accent,#111) 35%,transparent);--mk-cta-bg:var(--on-accent,#111);--mk-cta-fg:var(--accent,#f59e0b);--mk-soft:color-mix(in srgb,var(--on-accent,#111) 14%,transparent)}
.mkp-w-sm{--mk-w:360px}.mkp-w-md{--mk-w:440px}.mkp-w-lg{--mk-w:560px}
.mkp-backdrop{position:absolute;inset:0;background:rgb(0 0 0 / var(--mk-overlay));opacity:0;transition:opacity .2s ease;pointer-events:auto}
.mkp-card{position:relative;display:flex;flex-direction:column;width:min(var(--mk-w),100%);max-height:min(92dvh,820px);overflow:hidden;background:var(--mk-bg);background-size:cover;background-position:center;color:var(--mk-fg);border-radius:var(--mk-radius);box-shadow:0 20px 60px rgb(0 0 0 / .3);opacity:0;transform:translateY(14px) scale(.98);transition:opacity .2s ease,transform .25s cubic-bezier(.2,.8,.2,1);pointer-events:auto}
.mkp-anim-fade .mkp-card{transform:none}.mkp-anim-zoom .mkp-card{transform:scale(.9)}.mkp-anim-none .mkp-card,.mkp-anim-none .mkp-backdrop{transition:none}
.mkp-in .mkp-backdrop{opacity:1}.mkp-in .mkp-card{opacity:1;transform:none}
.mkp-bottom{place-items:end center}
.mkp-side{inset:auto 16px 16px auto;padding:0;place-items:end}.mkp-side .mkp-card{width:min(340px,calc(100vw - 24px))}
.mkp-x{all:unset;position:absolute;top:10px;right:10px;z-index:2;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;cursor:pointer;color:var(--mk-fg);background:color-mix(in srgb,var(--mk-bg) 82%,transparent);box-shadow:0 1px 4px rgb(0 0 0 / .15)}
.mkp-media{flex:none;display:grid;place-items:center;background:color-mix(in srgb,var(--mk-fg) 5%,transparent)}
.mkp-img{display:block;width:100%;height:auto;max-height:min(32vh,320px);object-fit:contain}
.mkp-fit-cover .mkp-img{aspect-ratio:16/9;height:auto;max-height:none;object-fit:cover}
.mkp-main{display:flex;flex-direction:column;min-height:0;flex:1}
.mkp-scroll{min-height:0;overflow:auto;flex:1;overscroll-behavior:contain;scrollbar-width:thin}
.mkp-body{display:grid;gap:12px;padding:22px 20px 8px;text-align:center}
.mkp-a-left .mkp-body,.mkp-a-left .mkp-actions{text-align:left}
.mkp-badge{justify-self:center;display:inline-flex;align-items:center;gap:6px;margin:0;padding:5px 12px;border-radius:999px;background:var(--mk-soft);font-weight:800;font-size:1.05rem}
.mkp-a-left .mkp-badge{justify-self:start}
.mkp-title{margin:0;font-size:1.35rem;line-height:1.25;font-weight:800;overflow-wrap:anywhere;color:inherit}
.mkp-ts-sm .mkp-title{font-size:1.1rem}.mkp-ts-lg .mkp-title{font-size:1.75rem}
.mkp-text{margin:0;color:var(--mk-muted);line-height:1.5;white-space:pre-line}
.mkp-cd{display:flex;justify-content:center;align-items:baseline;gap:6px;font-size:.9rem;font-weight:600}
.mkp-a-left .mkp-cd{justify-content:flex-start}
.mkp-cd[hidden]{display:none}
.mkp-cd-time{font-variant-numeric:tabular-nums;font-size:1.05rem;letter-spacing:.03em}
.mkp-code{display:grid;gap:6px}
.mkp-code-label{font-size:.8rem;color:var(--mk-muted)}
.mkp-code-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:10px 14px;border:2px dashed var(--mk-line);border-radius:12px;cursor:pointer}
.mkp-code-btn b{font-size:1.2rem;letter-spacing:.12em;overflow-wrap:anywhere}
.mkp-copy{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;font-weight:600;color:var(--mk-muted);flex:none}
.mkp-code small{color:var(--mk-muted)}
.mkp-actions{flex:none;display:grid;gap:6px;padding:10px 20px 16px;background:inherit;text-align:center}
.mkp-img-background .mkp-actions{background:transparent}
.mkp-img-background{--mk-fg:#fff;--mk-muted:rgb(255 255 255 / .85);--mk-line:rgb(255 255 255 / .4);--mk-soft:rgb(255 255 255 / .18)}
.mkp-img-background .mkp-body{padding-top:40px}
.mkp-cta{all:unset;box-sizing:border-box;width:100%;min-height:48px;padding:12px 16px;border-radius:12px;background:var(--mk-cta-bg);color:var(--mk-cta-fg);font-weight:700;text-align:center;cursor:pointer}
.mkp-btn-pill .mkp-cta{border-radius:999px}.mkp-btn-square .mkp-cta{border-radius:4px}
.mkp-cta[disabled]{opacity:.6}
.mkp-dismiss{all:unset;justify-self:center;padding:4px 8px;font-size:.85rem;color:var(--mk-muted);text-decoration:underline;cursor:pointer}
.mkp-x:focus-visible,.mkp-cta:focus-visible,.mkp-dismiss:focus-visible,.mkp-code-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.mkp-phone{display:grid;gap:8px;text-align:left}
.mkp-phone label{font-size:.85rem;font-weight:600}
.mkp-row{display:flex;align-items:stretch;border:1px solid var(--mk-line);border-radius:12px;overflow:hidden;background:#fff;color:#111827}
.mkp-dial{display:grid;place-items:center;padding:0 12px;background:#f3f4f6;font-weight:600}
.mkp-row input{flex:1;min-width:0;border:0;padding:12px;font:inherit;font-size:16px;background:transparent;color:inherit;outline:none}
.mkp-err{margin:0;color:#dc2626;font-size:.85rem}
@media (min-width:768px){
  .mkp-img-left .mkp-card{flex-direction:row;width:min(calc(var(--mk-w) + 260px),100%)}
  .mkp-img-left .mkp-media{width:42%;align-self:stretch}
  .mkp-img-left .mkp-img{height:100%;max-height:none;aspect-ratio:auto}
  .mkp-img-left.mkp-fit-cover .mkp-img{object-fit:cover}
}
@media (max-width:767px){
  .mkp-body{gap:9px;padding:18px 16px 6px}
  .mkp-actions{padding:8px 16px calc(12px + env(safe-area-inset-bottom))}
  .mkp-title{font-size:1.2rem}.mkp-ts-sm .mkp-title{font-size:1.02rem}.mkp-ts-lg .mkp-title{font-size:1.45rem}
  .mkp-img{max-height:26vh}
  .mkp-fit-cover .mkp-img{aspect-ratio:2/1}
  .mkp-badge{font-size:.95rem}
  .mkp-m-bottom:not(.mkp-side){place-items:end center;padding:0}
  .mkp-m-bottom:not(.mkp-side) .mkp-card{width:100%;max-height:90dvh;border-radius:var(--mk-radius) var(--mk-radius) 0 0;transform:translateY(40px)}
  .mkp-m-center:not(.mkp-side){padding:12px}
  .mkp-m-center:not(.mkp-side) .mkp-card{max-height:88dvh}
  .mkp-m-fullscreen:not(.mkp-side){padding:0}
  .mkp-m-fullscreen:not(.mkp-side) .mkp-card{width:100%;height:100dvh;max-height:none;border-radius:0}
  .mkp-m-fullscreen .mkp-img{max-height:38vh}
  .mkp-in.mkp-m-bottom:not(.mkp-side) .mkp-card{transform:none}
  .mkp-side{inset:auto 12px 12px 12px}.mkp-side .mkp-card{width:100%;max-height:70dvh}
  .mkp-side .mkp-img{max-height:18vh}
}
.mkp-teaser{--mk-bg:var(--page,#fff);--mk-fg:var(--fg,#111827);position:fixed;left:12px;bottom:88px;z-index:65;display:flex;align-items:center;border-radius:999px;background:var(--mk-bg);color:var(--mk-fg);box-shadow:0 8px 24px rgb(0 0 0 / .18);border:1px solid var(--line,#e5e7eb);max-width:calc(100vw - 24px)}
.mkp-teaser.mkp-t-dark{--mk-bg:#111827;--mk-fg:#f9fafb;border-color:#111827}
.mkp-teaser.mkp-t-accent{--mk-bg:var(--accent,#f59e0b);--mk-fg:var(--on-accent,#111);border-color:var(--accent,#f59e0b)}
.mkp-teaser button{all:unset;display:inline-flex;align-items:center;gap:6px;padding:9px 6px 9px 14px;cursor:pointer;font-size:.88rem;white-space:nowrap}
.mkp-teaser .mkp-teaser-x{padding:9px 12px 9px 4px;opacity:.7}
@media (min-width:1024px){.mkp-teaser{bottom:20px}}
@media (prefers-reduced-motion:reduce){.mkp-card,.mkp-backdrop{transition:none}}
`
