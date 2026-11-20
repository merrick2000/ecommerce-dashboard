// Primitives vectorielles partagées (scènes plates façon CityArt / NicheArt).
import opentype from 'opentype.js'

const fontBold = opentype.parse(await Bun.file(import.meta.dir + '/Ubuntu-B.ttf').arrayBuffer())
const fontMed = opentype.parse(await Bun.file(import.meta.dir + '/Ubuntu-M.ttf').arrayBuffer())

function pathData(p: any) {
  const n = (v: number) => (Math.round(v * 100) / 100).toString()
  const ok = (...v: any[]) => v.every((x) => typeof x === 'number' && isFinite(x))
  let d = ''
  for (const c of p.commands) {
    if (c.type === 'M' && ok(c.x, c.y)) d += `M${n(c.x)} ${n(c.y)}`
    else if (c.type === 'L' && ok(c.x, c.y)) d += `L${n(c.x)} ${n(c.y)}`
    else if (c.type === 'Q') d += ok(c.x1, c.y1) ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}` : `L${n(c.x)} ${n(c.y)}`
    else if (c.type === 'C') d += ok(c.x1, c.y1, c.x2, c.y2) ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}` : `L${n(c.x)} ${n(c.y)}`
    else if (c.type === 'Z') d += 'Z'
  }
  return d
}
export function textWidth(s: string, size: number, weight: 'b' | 'm' = 'b', spacing = 0) {
  const f = weight === 'b' ? fontBold : fontMed
  return f.getAdvanceWidth(s, size) + spacing * Math.max(0, [...s].length - 1)
}
/** Texte converti en chemin SVG. anchor: start | middle | end. */
export function txt(s: string, x: number, y: number, size: number, fill: string, opts: { anchor?: 'start' | 'middle' | 'end'; weight?: 'b' | 'm'; spacing?: number; opacity?: number } = {}) {
  const f = opts.weight === 'm' ? fontMed : fontBold
  const sp = opts.spacing ?? 0
  const w = textWidth(s, size, opts.weight ?? 'b', sp)
  let x0 = x
  if (opts.anchor === 'middle') x0 = x - w / 2
  else if (opts.anchor === 'end') x0 = x - w
  let d = ''
  if (!sp) d = pathData(f.getPath(s, x0, y, size))
  else {
    let cx = x0
    for (const ch of s) {
      d += pathData(f.getPath(ch, cx, y, size))
      cx += f.getAdvanceWidth(ch, size) + sp
    }
  }
  return `<path d="${d}" fill="${fill}"${opts.opacity != null ? ` opacity="${opts.opacity}"` : ''}/>`
}

// ---------- Aléatoire déterministe ----------
export function rng(key: string) {
  let seed = [...key].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const r = () => {
    seed = (seed * 1103515245 + 12345) >>> 0
    return ((seed >>> 8) % 10000) / 10000
  }
  r()
  r()
  return r
}

// ---------- Couleurs ----------
export type Pal = { soft: string; mid: string; deep: string; tint: string }
export const PALS: Record<string, Pal> = {
  amber: { soft: '#fde68a', mid: '#f59e0b', deep: '#b45309', tint: '#fef3c7' },
  green: { soft: '#bbf7d0', mid: '#22c55e', deep: '#15803d', tint: '#dcfce7' },
  blue: { soft: '#bae6fd', mid: '#0ea5e9', deep: '#0369a1', tint: '#e0f2fe' },
  orange: { soft: '#fed7aa', mid: '#f97316', deep: '#c2410c', tint: '#ffedd5' },
  violet: { soft: '#ddd6fe', mid: '#8b5cf6', deep: '#6d28d9', tint: '#ede9fe' },
}
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mix(a: string, b: string, t: number) {
  const A = hex(a), B = hex(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}
export const INK = '#1c1917'
export const CREAM = '#fffbeb'

let uid = 0
export const id = (p: string) => `${p}${++uid}`

// ---------- Formes ----------
export function star(cx: number, cy: number, r1: number, r2: number, fill: string, n = 5, rot = -90) {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1
    const a = ((rot + (i * 180) / n) * Math.PI) / 180
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="${(r1 * 0.12).toFixed(1)}" stroke-linejoin="round"/>`
}
export function sparkle(cx: number, cy: number, r: number, fill: string, op = 1) {
  const k = r * 0.22
  return `<path d="M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z" fill="${fill}" opacity="${op}"/>`
}
export function heart(cx: number, cy: number, s: number, fill: string) {
  return `<path transform="translate(${cx - 14 * s} ${cy - 13 * s}) scale(${s})" d="M14 26 C6 20 0 15 0 8.5 C0 3.5 3.8 0 8 0 C10.8 0 12.8 1.5 14 3.6 C15.2 1.5 17.2 0 20 0 C24.2 0 28 3.5 28 8.5 C28 15 22 20 14 26Z" fill="${fill}"/>`
}
export function check(cx: number, cy: number, r: number, bg = '#22c55e', fg = '#fff') {
  const k = r / 22
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/><path d="M${cx - 9 * k} ${cy + 0.5 * k} L${cx - 2.5 * k} ${cy + 7 * k} L${cx + 10 * k} ${cy - 6 * k}" fill="none" stroke="${fg}" stroke-width="${(4.5 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`
}
export function bars(x: number, y: number, widths: number[], color: string, h = 10, gap = 18) {
  return widths.map((w, i) => `<rect x="${x}" y="${y + i * gap}" width="${w}" height="${h}" rx="${h / 2}" fill="${color}"/>`).join('')
}
export function shadow(cx: number, cy: number, rx: number, ry = 18, op = 0.12) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}" opacity="${op}"/>`
}
export function card(x: number, y: number, w: number, h: number, inner = '', rx = 22, fill = '#fff') {
  return `<g><rect x="${x + 4}" y="${y + 10}" width="${w}" height="${h}" rx="${rx}" fill="${INK}" opacity="0.08"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>${inner}</g>`
}

/** Téléphone : contenu dessiné en coordonnées de l'écran (0,0 = coin écran), écran = (w-20)×(h-20). */
export function phone(x: number, y: number, w: number, h: number, screen: (sw: number, sh: number) => string, screenBg = '#fff', body = INK) {
  const cid = id('ph')
  const sw = w - 20, sh = h - 20
  return `<g transform="translate(${x} ${y})">
<rect x="8" y="16" width="${w}" height="${h}" rx="36" fill="${INK}" opacity="0.10"/>
<rect width="${w}" height="${h}" rx="36" fill="${body}"/>
<clipPath id="${cid}"><rect x="10" y="10" width="${sw}" height="${sh}" rx="27"/></clipPath>
<g clip-path="url(#${cid})"><rect x="10" y="10" width="${sw}" height="${sh}" fill="${screenBg}"/><g transform="translate(10 10)">${screen(sw, sh)}</g></g>
<rect x="${w / 2 - 28}" y="17" width="56" height="11" rx="5.5" fill="${body}"/>
</g>`
}

/** Écran de discussion (bulles type messagerie, sans logo). */
export function chatScreen(accent: string, seedR: () => number) {
  return (sw: number, sh: number) => {
    let s = `<rect width="${sw}" height="64" fill="${accent}"/><circle cx="34" cy="38" r="14" fill="#fff" opacity="0.85"/><rect x="58" y="30" width="${sw * 0.38}" height="9" rx="4.5" fill="#fff" opacity="0.9"/><rect x="58" y="44" width="${sw * 0.22}" height="7" rx="3.5" fill="#fff" opacity="0.6"/>`
    s += `<rect y="64" width="${sw}" height="${sh - 64}" fill="#f5f0e8"/>`
    let y = 84
    const n = 4
    for (let i = 0; i < n; i++) {
      const me = i % 2 === 1
      const lines = 1 + Math.floor(seedR() * 2) + (i === 0 ? 1 : 0)
      const bw = sw * (0.55 + seedR() * 0.2)
      const bh = 18 + lines * 15
      const bx = me ? sw - bw - 12 : 12
      s += `<rect x="${bx}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="${me ? '#d9fdd3' : '#fff'}"/>`
      for (let l = 0; l < lines; l++) s += `<rect x="${bx + 12}" y="${y + 12 + l * 15}" width="${(bw - 24) * (l === lines - 1 ? 0.6 : 1)}" height="7" rx="3.5" fill="${me ? '#86c88f' : '#d6d3d1'}"/>`
      if (me) s += `<path d="M${bx + bw - 34} ${y + bh - 11} l4 4 l7 -7 M${bx + bw - 26} ${y + bh - 11} l4 4 l7 -7" fill="none" stroke="#0ea5e9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
      y += bh + 14
    }
    s += `<rect x="12" y="${sh - 54}" width="${sw - 70}" height="38" rx="19" fill="#fff"/><circle cx="${sw - 33}" cy="${sh - 35}" r="19" fill="${accent}"/><path d="M${sw - 40} ${sh - 43} l15 8 l-15 8 z" fill="#fff"/>`
    return s
  }
}

/** Écran Mobile Money : coche, montant et code devise. */
export function moneyScreen(accent: string, amount: string, code: string) {
  return (sw: number, sh: number) => {
    let s = `<rect width="${sw}" height="${sh * 0.46}" fill="${accent}"/>`
    s += `<circle cx="${sw / 2}" cy="${sh * 0.2}" r="34" fill="#fff"/>` + check(sw / 2, sh * 0.2, 26, '#22c55e')
    if (amount) {
      const size = Math.min(44, ((sw - 36) / textWidth(amount, 44)) * 44)
      s += txt(amount, sw / 2, sh * 0.36, size, '#fff', { anchor: 'middle' })
      s += `<rect x="${sw / 2 - 40}" y="${sh * 0.385}" width="80" height="30" rx="15" fill="#fff" opacity="0.25"/>` + txt(code, sw / 2, sh * 0.385 + 22, 19, '#fff', { anchor: 'middle' })
    } else {
      const size = Math.min(46, ((sw - 40) / textWidth(code, 46, 'b', 3)) * 46)
      s += txt(code, sw / 2, sh * 0.4, size, '#fff', { anchor: 'middle', spacing: 3 })
    }
    for (let i = 0; i < 3; i++) {
      const yy = sh * 0.52 + i * 50
      s += `<rect x="16" y="${yy}" width="${sw - 32}" height="38" rx="12" fill="#f5f5f4"/><circle cx="36" cy="${yy + 19}" r="9" fill="${i === 0 ? accent : '#d6d3d1'}"/><rect x="54" y="${yy + 15}" width="${(sw - 100) * (0.8 - i * 0.15)}" height="8" rx="4" fill="#d6d3d1"/>`
    }
    s += `<rect x="16" y="${sh - 62}" width="${sw - 32}" height="44" rx="22" fill="${INK}"/><rect x="${sw / 2 - 30}" y="${sh - 44}" width="60" height="8" rx="4" fill="#fff" opacity="0.8"/>`
    return s
  }
}

/** Écran boutique : image produit, prix, bouton commander. */
export function storeScreen(pal: Pal, alt: Pal, kind = 0) {
  return (sw: number, sh: number) => {
    let s = `<rect width="${sw}" height="${sh}" fill="#fff"/><rect x="16" y="34" width="${sw * 0.3}" height="10" rx="5" fill="#d6d3d1"/><circle cx="${sw - 28}" cy="39" r="11" fill="${pal.tint}"/>`
    const ih = sh * 0.42
    s += `<rect x="14" y="62" width="${sw - 28}" height="${ih}" rx="18" fill="${alt.tint}"/>`
    const cx = sw / 2, cy = 62 + ih / 2
    if (kind % 3 === 0) {
      // flacon
      s += `<rect x="${cx - 26}" y="${cy - 44}" width="52" height="96" rx="16" fill="${alt.mid}"/><rect x="${cx - 12}" y="${cy - 64}" width="24" height="24" rx="5" fill="${alt.deep}"/><rect x="${cx - 18}" y="${cy - 8}" width="36" height="30" rx="6" fill="#fff" opacity="0.85"/>`
    } else if (kind % 3 === 1) {
      // sac à main
      s += `<path d="M${cx - 22} ${cy - 22} q0 -34 22 -34 q22 0 22 34" fill="none" stroke="${alt.deep}" stroke-width="7"/><rect x="${cx - 46}" y="${cy - 26}" width="92" height="76" rx="14" fill="${alt.mid}"/><rect x="${cx - 46}" y="${cy - 6}" width="92" height="8" fill="${alt.deep}" opacity="0.4"/>`
    } else {
      // basket
      s += `<path d="M${cx - 60} ${cy + 30} q0 -26 26 -30 l22 -30 q8 -8 18 -2 l16 22 q20 6 38 10 q10 4 0 30 z" fill="${alt.mid}"/><rect x="${cx - 62}" y="${cy + 26}" width="126" height="14" rx="7" fill="${alt.deep}"/><path d="M${cx - 18} ${cy - 22} l10 6 M${cx - 8} ${cy - 32} l10 6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`
    }
    const y2 = 62 + ih + 20
    s += bars(16, y2, [sw * 0.7, sw * 0.45], '#d6d3d1', 10, 20)
    s += `<rect x="16" y="${y2 + 48}" width="82" height="30" rx="15" fill="${pal.tint}"/><rect x="28" y="${y2 + 59}" width="58" height="8" rx="4" fill="${pal.deep}"/>`
    s += [0, 1, 2, 3, 4].map((i) => star(sw - 84 + i * 16, y2 + 63, 7, 3.2, '#f59e0b')).join('')
    s += `<rect x="16" y="${sh - 66}" width="${sw - 32}" height="48" rx="24" fill="${pal.mid}"/><rect x="${sw / 2 - 44}" y="${sh - 46}" width="88" height="9" rx="4.5" fill="#fff"/>`
    return s
  }
}

/** Colis (2,5D). */
export function box(x: number, y: number, w: number, h: number, d: number, opts: { front?: string; label?: boolean } = {}) {
  const f = opts.front ?? '#e3a869'
  const top = mix(f, '#ffffff', 0.32), side = mix(f, '#000000', 0.16)
  const dy = d * 0.55
  let s = `<g>`
  s += `<polygon points="${x},${y} ${x + d},${y - dy} ${x + w + d},${y - dy} ${x + w},${y}" fill="${top}"/>`
  s += `<polygon points="${x + w},${y} ${x + w + d},${y - dy} ${x + w + d},${y + h - dy} ${x + w},${y + h}" fill="${side}"/>`
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`
  const tw = Math.max(12, w * 0.16)
  s += `<rect x="${x + w / 2 - tw / 2}" y="${y}" width="${tw}" height="${h * 0.32}" fill="#fff" opacity="0.45"/>`
  s += `<polygon points="${x + w / 2 - tw / 2},${y} ${x + w / 2 - tw / 2 + d},${y - dy} ${x + w / 2 + tw / 2 + d},${y - dy} ${x + w / 2 + tw / 2},${y}" fill="#fff" opacity="0.45"/>`
  if (opts.label !== false && w > 70) s += `<rect x="${x + w * 0.56}" y="${y + h * 0.58}" width="${w * 0.32}" height="${h * 0.26}" rx="4" fill="#fff" opacity="0.9"/><rect x="${x + w * 0.6}" y="${y + h * 0.64}" width="${w * 0.22}" height="5" rx="2.5" fill="#a8a29e"/><rect x="${x + w * 0.6}" y="${y + h * 0.72}" width="${w * 0.14}" height="5" rx="2.5" fill="#a8a29e"/>`
  return s + '</g>'
}

/** Livreur à moto (vers la droite). Origine : coin haut-gauche du caisson, environ 250×225. */
export function rider(x: number, y: number, s: number, c: { body: string; jacket: string; helmet: string; crate: string }) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
<ellipse cx="135" cy="226" rx="120" ry="10" fill="${INK}" opacity="0.15"/>
<rect x="0" y="62" width="82" height="70" rx="12" fill="${c.crate}"/><rect x="0" y="62" width="82" height="16" rx="8" fill="${mix(c.crate, '#000000', 0.15)}"/><rect x="26" y="92" width="30" height="22" rx="5" fill="#fff" opacity="0.85"/>
<path d="M200 96 L222 196" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
<path d="M28 132 Q28 128 40 128 L150 128 Q164 128 170 140 L182 170 L60 176 Q28 176 28 150Z" fill="${c.body}"/>
<path d="M168 100 L200 92 L214 162 L182 170 Z" fill="${c.body}"/>
<path d="M150 166 L196 166" stroke="${mix(c.body, '#000000', 0.25)}" stroke-width="10" stroke-linecap="round"/>
<circle cx="206" cy="112" r="9" fill="#fde68a"/>
<g><circle cx="58" cy="194" r="32" fill="${INK}" stroke="#fafaf9" stroke-width="3"/><circle cx="58" cy="194" r="13" fill="#78716c"/><circle cx="58" cy="194" r="4" fill="#e7e5e4"/></g>
<g><circle cx="222" cy="194" r="32" fill="${INK}" stroke="#fafaf9" stroke-width="3"/><circle cx="222" cy="194" r="13" fill="#78716c"/><circle cx="222" cy="194" r="4" fill="#e7e5e4"/></g>
<path d="M112 122 L150 136 L160 164" fill="none" stroke="#44403c" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M90 128 Q86 84 110 54 L144 60 Q140 98 130 130Z" fill="${c.jacket}"/>
<path d="M132 72 L176 90" stroke="${mix(c.jacket, '#000000', 0.18)}" stroke-width="17" stroke-linecap="round"/>
<path d="M172 88 L198 82" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
<circle cx="128" cy="34" r="26" fill="${c.helmet}"/><path d="M126 30 h26 a8 8 0 0 1 0 16 h-26z" fill="#292524"/><path d="M106 22 a26 26 0 0 1 30 -12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
</g>`
}

export function coins(x: number, y: number, n: number, r = 34) {
  let s = ''
  for (let i = 0; i < n; i++) {
    const yy = y - i * 13
    s += `<ellipse cx="${x}" cy="${yy + 6}" rx="${r}" ry="${r * 0.36}" fill="#b45309"/><rect x="${x - r}" y="${yy - 4}" width="${r * 2}" height="10" fill="#d97706"/><ellipse cx="${x}" cy="${yy - 4}" rx="${r}" ry="${r * 0.36}" fill="#fbbf24"/>`
  }
  const ty = y - (n - 1) * 13 - 4
  s += `<ellipse cx="${x}" cy="${ty}" rx="${r * 0.62}" ry="${r * 0.2}" fill="none" stroke="#f59e0b" stroke-width="3"/>`
  return s
}
export function coin(cx: number, cy: number, r: number) {
  return `<circle cx="${cx + r * 0.12}" cy="${cy + r * 0.12}" r="${r}" fill="#b45309"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbbf24"/><circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="none" stroke="#f59e0b" stroke-width="${r * 0.12}"/><rect x="${cx - r * 0.1}" y="${cy - r * 0.38}" width="${r * 0.2}" height="${r * 0.76}" rx="${r * 0.1}" fill="#d97706"/>`
}
export function bill(x: number, y: number, w: number, rot: number) {
  const h = w * 0.5
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#16a34a"/><rect x="${-w / 2 + 7}" y="${-h / 2 + 7}" width="${w - 14}" height="${h - 14}" rx="5" fill="none" stroke="#bbf7d0" stroke-width="3"/><circle cx="0" cy="0" r="${h * 0.24}" fill="#bbf7d0"/></g>`
}

export function megaphone(x: number, y: number, s: number, color: string, deep: string) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-14)">
<path d="M0 40 L0 100 L40 100 L150 150 L150 -10 L40 40 Z" fill="${color}"/>
<rect x="-22" y="40" width="34" height="60" rx="10" fill="${deep}"/>
<ellipse cx="150" cy="70" rx="20" ry="80" fill="${deep}"/><ellipse cx="150" cy="70" rx="11" ry="62" fill="${mix(color, '#ffffff', 0.5)}"/>
<path d="M40 100 L56 150 L82 150 L72 112 Z" fill="${deep}"/>
<path d="M190 30 q22 40 0 80 M215 8 q36 62 0 124" fill="none" stroke="${deep}" stroke-width="9" stroke-linecap="round" opacity="0.7"/>
</g>`
}

export function play(cx: number, cy: number, r: number, color: string) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><path d="M${cx - r * 0.3} ${cy - r * 0.42} L${cx + r * 0.46} ${cy} L${cx - r * 0.3} ${cy + r * 0.42}Z" fill="${color}" stroke="${color}" stroke-width="${r * 0.12}" stroke-linejoin="round"/>`
}

export function cursor(x: number, y: number, s = 1) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 L0 46 L12 35 L21 55 L30 51 L21 31 L37 30 Z" fill="${INK}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`
}

export function chartCard(x: number, y: number, w: number, h: number, pal: Pal, rising = true) {
  const n = 5
  let inner = ''
  const bw = (w - 48) / n - 10
  for (let i = 0; i < n; i++) {
    const t = rising ? 0.3 + (i / (n - 1)) * 0.6 : 0.4 + Math.sin(i * 1.7) * 0.25
    const bh = (h - 70) * t
    inner += `<rect x="${x + 24 + i * (bw + 10)}" y="${y + h - 22 - bh}" width="${bw}" height="${bh}" rx="6" fill="${i === n - 1 ? pal.mid : pal.soft}"/>`
  }
  inner += `<rect x="${x + 24}" y="${y + 20}" width="${w * 0.35}" height="9" rx="4.5" fill="#d6d3d1"/>`
  const ax = x + w - 34, ay = y + 26
  inner += `<circle cx="${ax}" cy="${ay}" r="15" fill="${pal.tint}"/><path d="M${ax - 6} ${ay + 5} L${ax + 5} ${ay - 6} M${ax - 3} ${ay - 6} h8 v8" fill="none" stroke="${pal.deep}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
  return card(x, y, w, h, inner, 20)
}

export function calendar(x: number, y: number, w: number, h: number, pal: Pal, hl: number[], dark = false) {
  const body = dark ? '#292524' : '#fff'
  let s = card(x, y, w, h, '', 26, body)
  s += `<path d="M${x} ${y + 26} a26 26 0 0 1 26 -26 h${w - 52} a26 26 0 0 1 26 26 v44 h${-w} z" fill="${pal.mid}"/>`
  s += `<rect x="${x + w * 0.28 - 7}" y="${y - 18}" width="14" height="40" rx="7" fill="${INK}"/><rect x="${x + w * 0.72 - 7}" y="${y - 18}" width="14" height="40" rx="7" fill="${INK}"/>`
  const cols = 7, rows = 5
  const gx = x + 22, gy = y + 90
  const cw = (w - 44) / cols, ch = (h - 110) / rows
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const cx = gx + c * cw + cw / 2, cy = gy + r * ch + ch / 2
      const k = hl.indexOf(i)
      if (k === 0) s += `<circle cx="${cx}" cy="${cy}" r="${Math.min(cw, ch) * 0.46}" fill="${pal.mid}"/>` + star(cx, cy, Math.min(cw, ch) * 0.24, Math.min(cw, ch) * 0.11, '#fff')
      else if (k > 0) s += `<circle cx="${cx}" cy="${cy}" r="${Math.min(cw, ch) * 0.4}" fill="${pal.soft}"/>`
      else s += `<rect x="${cx - cw * 0.26}" y="${cy - ch * 0.2}" width="${cw * 0.52}" height="${ch * 0.4}" rx="5" fill="${dark ? '#44403c' : '#f0eeec'}"/>`
    }
  return s
}

export function gift(x: number, y: number, w: number, color: string, ribbon: string) {
  const h = w * 0.8
  return `<g><rect x="${x + 5}" y="${y + 10}" width="${w}" height="${h}" rx="10" fill="${INK}" opacity="0.08"/><rect x="${x}" y="${y + w * 0.22}" width="${w}" height="${h - w * 0.22}" rx="10" fill="${color}"/><rect x="${x - 8}" y="${y}" width="${w + 16}" height="${w * 0.26}" rx="9" fill="${mix(color, '#000000', 0.12)}"/><rect x="${x + w / 2 - w * 0.08}" y="${y}" width="${w * 0.16}" height="${h}" fill="${ribbon}"/>
<path d="M${x + w / 2} ${y} c-${w * 0.32} -${w * 0.34} -${w * 0.42} ${w * 0.02} 0 0 c${w * 0.42} ${w * 0.02} ${w * 0.32} -${w * 0.34} 0 0z" fill="none" stroke="${ribbon}" stroke-width="${w * 0.08}" stroke-linejoin="round"/></g>`
}

/** Étiquette de prix avec symbole pourcentage dessiné. */
export function tag(x: number, y: number, s: number, color: string, rot = -18) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
<path d="M0 0 L110 0 Q124 0 124 14 L124 106 Q124 120 110 120 L0 120 L-46 60 Z" fill="${color}"/>
<circle cx="-14" cy="60" r="10" fill="#fff"/>
<circle cx="40" cy="38" r="12" fill="none" stroke="#fff" stroke-width="8"/><circle cx="84" cy="82" r="12" fill="none" stroke="#fff" stroke-width="8"/><path d="M90 30 L34 90" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
</g>`
}

export function magnifier(x: number, y: number, r: number, color: string) {
  return `<g><path d="M${x + r * 0.7} ${y + r * 0.7} L${x + r * 1.6} ${y + r * 1.6}" stroke="${INK}" stroke-width="${r * 0.32}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.55"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="${r * 0.2}"/><path d="M${x - r * 0.5} ${y - r * 0.3} a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.4} -${r * 0.3}" fill="none" stroke="#fff" stroke-width="${r * 0.1}" stroke-linecap="round"/></g>`
}

export function target(cx: number, cy: number, r: number, color: string) {
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="${color}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.56}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${color}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.13}" fill="#fff"/>
<path d="M${cx} ${cy} L${cx + r * 1.05} ${cy - r * 1.05}" stroke="${INK}" stroke-width="${r * 0.08}" stroke-linecap="round"/><path d="M${cx + r * 0.95} ${cy - r * 0.95} l${r * 0.08} -${r * 0.34} l${r * 0.26} ${r * 0.26} z M${cx + r * 0.95} ${cy - r * 0.95} l${r * 0.34} -${r * 0.08} l-${r * 0.26} ${r * 0.26} z" fill="${INK}"/></g>`
}

export function pin(x: number, y: number, s: number, color: string, dot = '#fff') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="52" rx="12" ry="4" fill="${INK}" opacity="0.15"/><path d="M0 50 C-6 40 -24 28 -24 12 C-24 -2 -13 -12 0 -12 C13 -12 24 -2 24 12 C24 28 6 40 0 50Z" fill="${color}"/><circle cx="0" cy="11" r="9" fill="${dot}"/></g>`
}

export function bubble(x: number, y: number, w: number, h: number, fill: string, inner = '', tailLeft = true) {
  const tail = tailLeft ? `<path d="M${x + 22} ${y + h - 2} l-6 20 l24 -20z" fill="${fill}"/>` : `<path d="M${x + w - 22} ${y + h - 2} l6 20 l-24 -20z" fill="${fill}"/>`
  return `<g><rect x="${x + 3}" y="${y + 8}" width="${w}" height="${h}" rx="${h / 2.4}" fill="${INK}" opacity="0.08"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.4}" fill="${fill}"/>${tail}${inner}</g>`
}

export function bell(cx: number, cy: number, s: number, color: string) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><path d="M-14 6 Q-14 -14 0 -14 Q14 -14 14 6 L18 12 L-18 12Z" fill="${color}"/><circle cx="0" cy="16" r="4.5" fill="${color}"/></g>`
}

export function bag(x: number, y: number, w: number, color: string, handle: string) {
  const h = w * 1.05
  return `<g><path d="M${x + w * 0.3} ${y + w * 0.12} q0 -${w * 0.32} ${w * 0.2} -${w * 0.32} q${w * 0.2} 0 ${w * 0.2} ${w * 0.32}" fill="none" stroke="${handle}" stroke-width="${w * 0.07}" stroke-linecap="round"/><rect x="${x + 6}" y="${y + 12}" width="${w}" height="${h}" rx="14" fill="${INK}" opacity="0.08"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${color}"/><rect x="${x}" y="${y}" width="${w}" height="${w * 0.14}" rx="6" fill="${mix(color, '#000000', 0.12)}"/><circle cx="${x + w * 0.3}" cy="${y + w * 0.22}" r="${w * 0.035}" fill="${handle}"/><circle cx="${x + w * 0.7}" cy="${y + w * 0.22}" r="${w * 0.035}" fill="${handle}"/></g>`
}

export function headset(cx: number, cy: number, r: number, color: string) {
  return `<g><path d="M${cx - r} ${cy + r * 0.2} a${r} ${r} 0 0 1 ${2 * r} 0" fill="none" stroke="${INK}" stroke-width="${r * 0.16}" stroke-linecap="round"/><rect x="${cx - r * 1.18}" y="${cy}" width="${r * 0.44}" height="${r * 0.72}" rx="${r * 0.18}" fill="${color}"/><rect x="${cx + r * 0.74}" y="${cy}" width="${r * 0.44}" height="${r * 0.72}" rx="${r * 0.18}" fill="${color}"/><path d="M${cx + r * 0.96} ${cy + r * 0.72} q0 ${r * 0.5} -${r * 0.7} ${r * 0.55}" fill="none" stroke="${INK}" stroke-width="${r * 0.1}" stroke-linecap="round"/><circle cx="${cx + r * 0.2}" cy="${cy + r * 1.27}" r="${r * 0.12}" fill="${INK}"/></g>`
}

export function returnArrow(cx: number, cy: number, r: number, color: string) {
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><path d="M${cx + r * 0.45} ${cy - r * 0.15} a${r * 0.48} ${r * 0.48} 0 1 0 -${r * 0.1} ${r * 0.48}" fill="none" stroke="${color}" stroke-width="${r * 0.16}" stroke-linecap="round"/><path d="M${cx + r * 0.22} ${cy - r * 0.32} l${r * 0.28} ${r * 0.2} l${r * 0.06} -${r * 0.34}" fill="none" stroke="${color}" stroke-width="${r * 0.16}" stroke-linecap="round" stroke-linejoin="round"/></g>`
}

export function plane(x: number, y: number, s: number, color: string) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-8)"><path d="M0 20 Q0 10 14 10 L120 10 Q140 10 148 20 Q140 30 120 30 L14 30 Q0 30 0 20Z" fill="#fff"/><path d="M60 12 L84 -28 L98 -28 L88 12Z M60 28 L84 66 L98 66 L88 28Z" fill="${color}"/><path d="M6 12 L0 -10 L14 -10 L26 12Z" fill="${color}"/><circle cx="118" cy="18" r="3.5" fill="${color}"/><circle cx="106" cy="18" r="3.5" fill="${color}"/><circle cx="94" cy="18" r="3.5" fill="${color}"/></g>`
}
