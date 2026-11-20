// Scènes 1280×720. Sujet principal contenu dans la bande x 300..980 (réutilisée telle quelle à droite des images OG).
import * as L from './lib'
const { PALS, mix, INK, CREAM } = L
type Pal = L.Pal

export type Scene = { bgTop: string; bgBottom: string; art: string; dark?: boolean }

const PAL_KEYS = ['amber', 'green', 'blue', 'orange', 'violet'] as const

export function background(sc: Scene, r: () => number, w = 1280, h = 720) {
  const gid = L.id('bg')
  let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${sc.bgTop}"/><stop offset="1" stop-color="${sc.bgBottom}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${gid})"/>`
  const deco = sc.dark ? '#ffffff' : '#ffffff'
  s += `<circle cx="${1060 + r() * 80}" cy="${120 + r() * 40}" r="${70 + r() * 20}" fill="${deco}" opacity="${sc.dark ? 0.06 : 0.55}"/>`
  s += `<circle cx="${140 + r() * 60}" cy="${560 + r() * 60}" r="${150 + r() * 40}" fill="${deco}" opacity="${sc.dark ? 0.04 : 0.35}"/>`
  // points décoratifs
  const px = 120 + r() * 60, py = 110 + r() * 40
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += `<circle cx="${px + i * 22}" cy="${py + j * 22}" r="3.2" fill="${sc.dark ? '#fff' : INK}" opacity="${sc.dark ? 0.15 : 0.1}"/>`
  return s
}

function pickPals(r: () => number, prefer?: number) {
  const a = prefer ?? Math.floor(r() * 5)
  const b = (a + 1 + Math.floor(r() * 4)) % 5
  return [PALS[PAL_KEYS[a]!]!, PALS[PAL_KEYS[b]!]!] as const
}

const sparkles = (pts: [number, number, number][], color: string, op = 0.9) => pts.map(([x, y, rr]) => L.sparkle(x, y, rr, color, op)).join('')

// ------------------------------------------------------------------ Guides
export function guideScene(slug: string, category: string, idx = 0): Scene {
  const r = L.rng(slug)
  const flip = r() > 0.5 ? -1 : 1
  const X = (dx: number) => 640 + dx * flip // position miroir (éléments non retournés)
  const prefer: Record<string, number> = { vendre: 1, publicite: 4, cod: 0, paiement: 2, saisonnier: 3, produit: 0 }
  r()
  const [p, q] = pickPals(r, (prefer[category]! + idx * 2) % 5)
  const sc: Scene = { bgTop: p.soft, bgBottom: CREAM, art: '' }
  let a = ''
  const has = (k: string) => slug.includes(k)

  if (category === 'vendre') {
    a += L.shadow(640, 640, 300, 22, 0.1)
    if (has('dropshipping')) {
      a += L.box(X(-300) - 70, 470, 150, 120, 60) + L.box(X(-300) - 40, 370, 110, 100, 46, { front: '#d99a5b' })
      a += `<path d="M${X(-170)} 330 q${110 * flip} -120 ${220 * flip} -40" fill="none" stroke="${p.deep}" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round"/>`
    } else {
      a += L.bag(X(-270) - 75, 400, 150, q.mid, q.deep) + L.check(X(-270) + 50, 420, 26)
    }
    a += L.phone(530, 110, 220, 470, L.storeScreen(p, q, Math.floor(r() * 3)))
    a += L.bubble(X(240) - 110, 170, 220, 76, '#fff', `<circle cx="${X(240) - 72}" cy="208" r="22" fill="${p.tint}"/>` + L.bell(X(240) - 72, 206, 0.9, p.mid) + L.bars(X(240) - 38, 192, [120, 80], '#d6d3d1', 10, 20), flip > 0)
    a += L.box(X(250) - 70, 470, 140, 110, 56)
    if (has('page')) a += L.cursor(686, 520, 1.3)
    a += L.card(X(250) - 90, 330, 180, 56, [0, 1, 2, 3, 4].map((i) => L.star(X(250) - 60 + i * 30, 358, 12, 5.5, '#f59e0b')).join(''), 28)
    a += sparkles([[X(-190), 190, 16], [X(380), 400, 12], [X(-380), 330, 10]], p.mid)
  } else if (category === 'publicite') {
    a += L.shadow(640, 640, 320, 22, 0.1)
    if (has('pixel')) {
      a += L.target(X(-270), 360, 92, p.mid)
      a += L.card(X(-270) - 70, 500, 140, 70, `<path d="M${X(-270) - 30} 520 l-18 15 l18 15 M${X(-270) + 30} 520 l18 15 l-18 15 M${X(-270) + 8} 516 l-16 38" fill="none" stroke="${p.deep}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`, 20)
    } else a += L.megaphone(X(-300) - (flip > 0 ? 90 : 60), 330, 1.05, p.mid, p.deep)
    if (has('tiktok')) {
      a += L.phone(545, 100, 210, 480, (sw, sh) => {
        const g = L.id('g')
        return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${q.mid}"/><stop offset="1" stop-color="${q.deep}"/></linearGradient></defs><rect width="${sw}" height="${sh}" fill="url(#${g})"/>` + L.play(sw / 2, sh * 0.42, 38, q.deep) + L.bars(18, sh - 110, [sw * 0.55, sw * 0.4], '#fff', 10, 20) + `<rect x="18" y="${sh - 62}" width="${sw - 80}" height="40" rx="20" fill="#fff"/>` + L.heart(sw - 30, sh * 0.6, 0.9, '#fff') + `<circle cx="${sw - 30}" cy="${sh * 0.7}" r="12" fill="#fff" opacity="0.85"/>`
      }, '#000')
    } else {
      const g = L.id('g')
      a += `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${q.mid}"/><stop offset="1" stop-color="${q.deep}"/></linearGradient></defs>`
      a += L.card(490, 140, 300, 400, `<path d="M490 162 a22 22 0 0 1 22 -22 h256 a22 22 0 0 1 22 22 v208 h-300z" fill="url(#${g})"/><circle cx="530" cy="185" r="16" fill="#fff" opacity="0.85"/><rect x="556" y="178" width="90" height="10" rx="5" fill="#fff" opacity="0.8"/>` + L.play(640, 270, 42, q.deep) + L.bars(514, 392, [220, 150], '#d6d3d1', 11, 22) + `<rect x="514" y="470" width="252" height="46" rx="23" fill="${p.mid}"/><rect x="600" y="488" width="80" height="10" rx="5" fill="#fff"/>`, 24)
      a += L.cursor(716, 494, 1.2)
    }
    a += L.bubble(X(250) - 70, 160, 140, 80, '#fff', L.heart(X(250) - 28, 200, 1.1, '#ef4444') + L.bars(X(250) + 2, 190, [40, 26], '#d6d3d1', 9, 18), flip < 0)
    a += L.chartCard(X(270) - 110, 330, 220, 200, p)
    a += sparkles([[X(-130), 150, 15], [X(400), 560, 11], [X(130), 600, 9]], p.mid)
  } else if (category === 'cod') {
    a += `<rect x="0" y="600" width="1280" height="120" fill="#44403c"/><path d="M0 650 H1280" stroke="#fef3c7" stroke-width="5" stroke-dasharray="26 22"/>`
    const rx = flip > 0 ? 300 : 700
    const ph = flip > 0 ? 720 : 340
    if (has('marge')) {
      a += L.chartCard(ph - 40, 150, 290, 260, p) + L.coins(ph + 210, 590, 5, 36) + L.coins(ph + 130, 595, 3, 30)
      a += L.rider(rx, 380, 1.0, { body: q.mid, jacket: p.deep, helmet: q.deep, crate: '#f59e0b' })
    } else if (has('closers') || has('script')) {
      a += L.phone(ph, 100, 210, 440, has('script') ? L.chatScreen('#16a34a', r) : (sw, sh) => `<rect width="${sw}" height="${sh}" fill="${INK}"/><circle cx="${sw / 2}" cy="${sh * 0.3}" r="48" fill="${p.mid}"/><circle cx="${sw / 2}" cy="${sh * 0.27}" r="18" fill="#fff" opacity="0.9"/><path d="M${sw / 2 - 30} ${sh * 0.38} q30 -34 60 0z" fill="#fff" opacity="0.9"/>` + L.bars(sw / 2 - 50, sh * 0.47, [100, 70], '#57534e', 10, 22) + `<circle cx="${sw * 0.3}" cy="${sh * 0.82}" r="26" fill="#ef4444"/><circle cx="${sw * 0.7}" cy="${sh * 0.82}" r="26" fill="#22c55e"/><path d="M${sw * 0.7 - 11} ${sh * 0.82 - 6} q2 14 18 18" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M${sw * 0.3 - 12} ${sh * 0.82} h24" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`)
      a += L.headset(ph + (flip > 0 ? 270 : -60), 190, 48, p.mid)
      a += L.rider(rx, 380, 1.0, { body: q.mid, jacket: p.deep, helmet: q.deep, crate: '#f59e0b' })
    } else {
      a += L.phone(ph, 110, 200, 420, L.chatScreen('#16a34a', r))
      a += L.rider(rx, 380, 1.0, { body: q.mid, jacket: p.deep, helmet: q.deep, crate: '#f59e0b' })
      if (has('retours')) a += L.box(ph + (flip > 0 ? 230 : -150), 470, 120, 100, 46) + L.returnArrow(ph + (flip > 0 ? 300 : -95), 410, 40, p.deep)
      else a += L.box(ph + (flip > 0 ? 230 : -150), 480, 110, 90, 44)
    }
    if (!has('marge')) a += L.check(ph + 206, 124, 30)
    a += L.bill(flip > 0 ? 300 : 960, 230, 96, -16) + L.bill(flip > 0 ? 350 : 910, 300, 80, 12)
    a += sparkles([[flip > 0 ? 520 : 760, 200, 14], [flip > 0 ? 980 : 300, 420, 11]], p.mid)
  } else if (category === 'paiement') {
    a += L.shadow(640, 640, 300, 22, 0.1)
    a += L.phone(525, 90, 230, 500, L.moneyScreen(p.mid, '25 000', 'XOF'))
    a += L.coins(X(-250), 600, 6, 44) + L.coins(X(-170), 610, 3, 36)
    a += `<path d="M${X(150)} 200 q${30 * flip} 30 0 60 M${X(185)} 180 q${48 * flip} 50 0 100" fill="none" stroke="${p.deep}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>`
    a += L.card(X(280) - 100, 330, 200, 130, `<rect x="${X(280) - 100}" y="354" width="200" height="24" fill="${q.mid}"/><rect x="${X(280) - 78}" y="400" width="44" height="32" rx="6" fill="#fbbf24"/><rect x="${X(280) - 20}" y="412" width="90" height="9" rx="4.5" fill="#d6d3d1"/>`, 18)
    a += L.coin(X(270), 220, 34) + L.coin(X(-300), 300, 26)
    a += sparkles([[X(-150), 170, 15], [X(360), 560, 12]], p.mid)
  } else if (category === 'saisonnier') {
    const dark = has('black')
    if (dark) Object.assign(sc, { bgTop: '#292524', bgBottom: '#44403c', dark: true })
    const pp = dark ? PALS.amber! : p
    a += L.shadow(640, 640, 320, 22, dark ? 0.3 : 0.1)
    a += L.calendar(470, 170, 340, 330, pp, [Math.floor(r() * 7) + 14, 3, 25], dark)
    a += L.gift(X(250) - 60, 480, 120, q.mid, q.soft) + L.gift(X(330) - 40, 530, 80, pp.mid, '#fff')
    a += L.tag(X(-270) - 20, 300, 1.1, dark ? '#ef4444' : pp.deep, flip > 0 ? -18 : 14)
    a += dark ? L.bag(X(-250) - 60, 470, 120, '#8b5cf6', '#6d28d9') : L.bag(X(-250) - 60, 470, 120, q.mid, q.deep)
    const conf = [[X(-150), 140, pp.mid], [X(220), 150, q.mid], [X(330), 280, '#ef4444'], [X(-350), 200, q.mid], [X(160), 330, pp.soft]] as const
    a += conf.map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="${12 + (i % 2) * 6}" height="${26 - (i % 2) * 8}" rx="4" fill="${c}" transform="rotate(${-30 + i * 25} ${x} ${y})"/>`).join('')
    a += sparkles([[X(250), 420, 16], [X(-130), 600, 11]], dark ? '#fbbf24' : pp.mid)
  } else {
    // produit
    a += L.shadow(640, 640, 300, 22, 0.1)
    a += L.box(500, 380, 240, 200, 90, { front: q.mid, label: false })
    a += `<circle cx="620" cy="480" r="48" fill="#fff"/>` + L.star(620, 482, 32, 14, '#f59e0b')
    a += L.magnifier(X(-230), 260, 78, p.deep)
    a += L.chartCard(X(280) - 110, 160, 220, 190, p)
    a += L.card(X(260) - 100, 420, 200, 58, [0, 1, 2, 3, 4].map((i) => L.star(X(260) - 64 + i * 32, 449, 13, 6, '#f59e0b')).join(''), 29)
    a += L.box(X(-300) - 50, 520, 100, 70, 40, { label: false })
    a += sparkles([[700, 250, 22], [560, 300, 12], [X(380), 560, 12]], p.mid)
  }
  sc.art = a
  return sc
}

// ------------------------------------------------------------------ Pays
/** Couleurs des drapeaux (vérifiées) ; ordre = bandes / couleurs principales. */
export const FLAGS: Record<string, string[]> = {
  'cote-d-ivoire': ['#F77F00', '#FFFFFF', '#009E60'],
  senegal: ['#00853F', '#FDEF42', '#E31B23'],
  benin: ['#008751', '#FCD116', '#E8112D'],
  togo: ['#006A4E', '#FFCE00', '#D21034', '#FFFFFF'],
  mali: ['#14B53A', '#FCD116', '#CE1126'],
  'burkina-faso': ['#EF2B2D', '#009E49', '#FCD116'],
  niger: ['#E05206', '#FFFFFF', '#0DB02B'],
  guinee: ['#CE1126', '#FCD116', '#009460'],
  cameroun: ['#007A5E', '#CE1126', '#FCD116'],
  gabon: ['#009E60', '#FCD116', '#3A75C4'],
  'congo-brazzaville': ['#009543', '#FBDE4A', '#DC241F'],
  'rd-congo': ['#007FFF', '#F7D618', '#CE1021'],
  tchad: ['#002664', '#FECB00', '#C60C30'],
  centrafrique: ['#003082', '#FFFFFF', '#289728', '#FFCE00', '#D21034'],
  madagascar: ['#FFFFFF', '#FC3D32', '#007E3A'],
  comores: ['#FFD100', '#FFFFFF', '#CE1126', '#3A75C4', '#009543'],
  djibouti: ['#6AB2E7', '#12AD2B', '#FFFFFF', '#D7141A'],
  burundi: ['#CE1126', '#1EB53A', '#FFFFFF'],
  rwanda: ['#00A1DE', '#FAD201', '#20603D'],
  maroc: ['#C1272D', '#006233'],
  tunisie: ['#E70013', '#FFFFFF'],
  algerie: ['#006633', '#FFFFFF', '#D21034'],
  nigeria: ['#008751', '#FFFFFF'],
  ghana: ['#CE1126', '#FCD116', '#006B3F', '#000000'],
  kenya: ['#000000', '#BB0000', '#006600', '#FFFFFF'],
  liberia: ['#BF0A30', '#FFFFFF', '#002868'],
  'sierra-leone': ['#1EB53A', '#FFFFFF', '#0072C6'],
  gambie: ['#CE1126', '#0C1C8C', '#3A7728', '#FFFFFF'],
  ouganda: ['#000000', '#FCDC04', '#D90000'],
  tanzanie: ['#1EB53A', '#FCD116', '#000000', '#00A3DD'],
  zambie: ['#198A00', '#DE2010', '#000000', '#EF7D00'],
  france: ['#0055A4', '#FFFFFF', '#EF4135'],
}
const isNeutral = (c: string) => ['#FFFFFF', '#000000'].includes(c.toUpperCase())
const lum = (c: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function bunting(colors: string[], r: () => number, y0 = 60, sag = 46) {
  let s = `<path d="M-20 ${y0} Q640 ${y0 + sag * 2} 1300 ${y0}" fill="none" stroke="#57534e" stroke-width="3"/>`
  const n = 17
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const x = -20 + 1320 * t
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0
    const c = colors[i % colors.length]!
    const stroke = c.toUpperCase() === '#FFFFFF' ? ` stroke="#d6d3d1" stroke-width="2"` : ''
    s += `<path d="M${x - 26} ${y} L${x + 26} ${y} L${x} ${y + 54} Z" fill="${c}"${stroke} stroke-linejoin="round"/>`
  }
  return s
}

export function countryScene(slug: string, currency: string, multi?: string[]): Scene {
  const r = L.rng(slug + ':pays')
  const flag = multi ?? FLAGS[slug]
  if (!flag) throw new Error('Pas de couleurs pour ' + slug)
  const chroma = flag.filter((c) => !isNeutral(c))
  const main = chroma[0]!
  const sc: Scene = { bgTop: mix(main, '#ffffff', 0.8), bgBottom: CREAM, art: '' }
  let a = bunting(flag, r)
  // horizon
  const back = mix(main, '#ffffff', 0.55)
  for (let i = 0; i < 12; i++) {
    const w = 54 + r() * 30, h = 120 + r() * 150, x = 250 + i * 66 - r() * 10
    a += `<rect x="${x}" y="${600 - h}" width="${w}" height="${h}" rx="6" fill="${back}" opacity="0.7"/>`
  }
  for (let i = 0; i < 9; i++) {
    const c0 = chroma[i % chroma.length]!
    const c = lum(c0) > 0.6 ? mix(c0, '#b45309', 0.12) : c0
    const w = 62 + r() * 22, h = 90 + r() * 130, x = 300 + i * 76 - r() * 8
    a += `<rect x="${x}" y="${600 - h}" width="${w}" height="${h}" rx="7" fill="${c}"/>`
    const win = lum(c) > 0.55 ? '#ffffff' : '#fef3c7'
    for (let k = 0; k < Math.floor((h - 30) / 34); k++) a += `<rect x="${x + 12}" y="${600 - h + 16 + k * 34}" width="${w - 24}" height="11" rx="3" fill="${win}" opacity="${lum(c) > 0.55 ? 0.7 : 0.8}"/>`
  }
  a += `<rect x="0" y="600" width="1280" height="120" fill="#44403c"/><path d="M0 652 H1280" stroke="#fef3c7" stroke-width="5" stroke-dasharray="26 22"/>`
  const flip = r() > 0.5
  const dark = chroma.slice().sort((x, y) => lum(x) - lum(y))[0]!
  const light = chroma.slice().sort((x, y) => lum(y) - lum(x))[0]!
  const crate = lum(light) > 0.45 ? light : '#f59e0b'
  const darkS = dark === '#000000' ? '#292524' : dark
  const jacket = chroma.length > 1 ? chroma[1]! : mix(main, '#000000', 0.25)
  a += L.rider(flip ? 620 : 400, 440, 0.95, { body: '#fafaf9', jacket, helmet: darkS, crate })
  const px = flip ? 330 : 760
  a += L.phone(px, 168, 190, 380, L.moneyScreen(darkS, '', currency))
  a += L.pin(flip ? 960 : 390, 250, 1.4, darkS, light === '#FFFFFF' ? '#fff' : light)
  if (slug === 'france') a += L.plane(600, 235, 1.0, '#0055A4')
  sc.art = a
  return sc
}

// ------------------------------------------------------------------ Génériques
export function genericScene(key: string): Scene {
  const r = L.rng('generic:' + key)
  const p = PALS.amber!, g = PALS.green!, b = PALS.blue!, o = PALS.orange!, v = PALS.violet!
  let a = ''
  let sc: Scene = { bgTop: p.soft, bgBottom: CREAM, art: '' }
  if (key === 'home') {
    a += `<rect x="0" y="600" width="1280" height="120" fill="#44403c"/><path d="M0 652 H1280" stroke="#fef3c7" stroke-width="5" stroke-dasharray="26 22"/>`
    a += L.phone(560, 90, 220, 470, L.storeScreen(p, g, 1))
    a += L.rider(300, 395, 0.95, { body: g.mid, jacket: b.deep, helmet: o.deep, crate: '#f59e0b' })
    a += L.box(820, 500, 120, 100, 48)
    a += L.bubble(810, 170, 210, 76, '#fff', `<circle cx="848" cy="208" r="22" fill="${g.tint}"/>` + L.check(848, 208, 16) + L.bars(882, 192, [110, 74], '#d6d3d1', 10, 20), true)
    a += L.coin(870, 380, 30) + sparkles([[500, 160, 15], [980, 450, 12]], p.mid)
  } else if (key === 'guides') {
    sc.bgTop = g.soft
    a += L.shadow(640, 640, 300, 22, 0.1)
    // livre ouvert
    a += `<path d="M640 300 Q540 250 420 270 L420 560 Q540 540 640 590 Z" fill="#fff"/><path d="M640 300 Q740 250 860 270 L860 560 Q740 540 640 590 Z" fill="#fafaf9"/><path d="M640 300 V590" stroke="#d6d3d1" stroke-width="4"/><path d="M420 560 Q540 540 640 590 Q740 540 860 560 L860 580 Q740 562 640 610 Q540 562 420 580Z" fill="${g.deep}"/>`
    a += [0, 1, 2, 3, 4].map((i) => `<path d="M455 ${320 + i * 44} Q540 ${304 + i * 44} 610 ${330 + i * 44}" fill="none" stroke="#d6d3d1" stroke-width="9" stroke-linecap="round"/>`).join('')
    a += [0, 1, 2].map((i) => L.check(690, 330 + i * 70, 16) + `<rect x="716" y="${322 + i * 70}" width="${110 - i * 20}" height="10" rx="5" fill="#d6d3d1"/>`).join('')
    // ampoule
    a += `<circle cx="640" cy="170" r="62" fill="#fde68a"/><circle cx="640" cy="160" r="40" fill="#f59e0b"/><rect x="620" y="196" width="40" height="22" rx="6" fill="#57534e"/><path d="M640 70 V50 M565 100 l-14 -14 M715 100 l14 -14" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>`
    a += sparkles([[380, 220, 15], [920, 230, 13]], g.mid)
  } else if (key === 'pays') {
    return countryScene('generic-pays', 'XOF', ['#F77F00', '#00853F', '#FCD116', '#CE1126', '#007FFF', '#FFFFFF'])
  } else if (key === 'alternatives') {
    sc.bgTop = v.soft
    a += L.shadow(640, 640, 320, 22, 0.1)
    a += `<g opacity="0.55">` + L.phone(380, 160, 190, 400, (sw, sh) => `<rect width="${sw}" height="${sh}" fill="#e7e5e4"/>` + L.bars(18, 40, [sw * 0.5], '#a8a29e') + `<rect x="14" y="70" width="${sw - 28}" height="${sh * 0.38}" rx="16" fill="#d6d3d1"/>` + L.bars(18, sh * 0.6, [sw * 0.7, sw * 0.5, sw * 0.6], '#a8a29e', 10, 22)) + `</g>`
    a += L.phone(720, 110, 220, 470, L.storeScreen(v, p, 0))
    a += `<path d="M590 300 h90" stroke="${v.deep}" stroke-width="12" stroke-linecap="round"/><path d="M660 276 l28 24 l-28 24" fill="none" stroke="${v.deep}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`
    a += `<path d="M690 400 h-90" stroke="${v.mid}" stroke-width="12" stroke-linecap="round" opacity="0.5"/>`
    a += L.check(930, 140, 32) + sparkles([[340, 150, 15], [990, 520, 12]], v.mid)
  } else if (key === 'comparatif') {
    sc.bgTop = b.soft
    a += L.shadow(640, 640, 320, 22, 0.1)
    const col = (x: number, good: boolean, pal: L.Pal) => {
      let s = L.card(x, 160, 230, 400, `<rect x="${x}" y="160" width="230" height="70" rx="22" fill="${pal.mid}"/><rect x="${x}" y="200" width="230" height="30" fill="${pal.mid}"/><rect x="${x + 24}" y="186" width="110" height="12" rx="6" fill="#fff"/>`, 22)
      for (let i = 0; i < 5; i++) {
        const ok = good || i % 2 === 0
        const yy = 270 + i * 56
        s += ok ? L.check(x + 40, yy, 15) : `<circle cx="${x + 40}" cy="${yy}" r="15" fill="#fecaca"/><path d="M${x + 34} ${yy - 6} l12 12 M${x + 46} ${yy - 6} l-12 12" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>`
        s += `<rect x="${x + 68}" y="${yy - 5}" width="${130 - (i % 3) * 20}" height="10" rx="5" fill="#d6d3d1"/>`
      }
      return s
    }
    a += col(380, false, PALS.blue!) + col(670, true, p)
    a += star(900, 150, 30, 13) + sparkles([[350, 150, 14], [960, 560, 12]], b.mid)
  } else if (key === 'outils') {
    sc.bgTop = o.soft
    a += L.shadow(640, 640, 320, 22, 0.1)
    // calculatrice
    let calc = `<rect x="430" y="150" width="240" height="420" rx="30" fill="#292524"/><rect x="454" y="176" width="192" height="90" rx="14" fill="#d9f99d"/><rect x="540" y="224" width="90" height="16" rx="8" fill="#3f6212"/>`
    for (let rr = 0; rr < 4; rr++) for (let cc = 0; cc < 3; cc++) calc += `<rect x="${458 + cc * 64}" y="${290 + rr * 66}" width="52" height="52" rx="14" fill="${cc === 2 && rr === 3 ? o.mid : '#57534e'}"/>`
    a += `<rect x="438" y="162" width="240" height="420" rx="30" fill="${INK}" opacity="0.1"/>` + calc
    a += L.chartCard(700, 170, 240, 210, o)
    // engrenage
    const gx = 830, gy = 500
    let gear = ''
    for (let i = 0; i < 8; i++) gear += `<rect x="${gx - 12}" y="${gy - 72}" width="24" height="30" rx="5" fill="${b.mid}" transform="rotate(${i * 45} ${gx} ${gy})"/>`
    a += gear + `<circle cx="${gx}" cy="${gy}" r="52" fill="${b.mid}"/><circle cx="${gx}" cy="${gy}" r="20" fill="${CREAM}"/>`
    a += sparkles([[380, 200, 15], [980, 420, 12]], o.mid)
  }
  sc.art = a
  return sc
  function star(x: number, y: number, r1: number, r2: number) {
    return `<circle cx="${x}" cy="${y}" r="${r1 + 16}" fill="#fff"/>` + L.star(x, y, r1, r2, '#f59e0b')
  }
}
