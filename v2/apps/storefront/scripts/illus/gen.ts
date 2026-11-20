// Génère couvertures WebP (1280×720) et images de partage JPEG (1200×630) en illustrations vectorielles.
// Usage : bun gen.ts [--write] [--only=guides,pays,generic,og] [--filter=slug]
import sharp from '/home/merrick/Works/ecommerce-dashboard/v2/node_modules/.bun/sharp@0.35.5+524d27868019c7b5/node_modules/sharp/dist/index.cjs'
import { mkdirSync, statSync } from 'node:fs'
import { GUIDES } from '/home/merrick/Works/ecommerce-dashboard/v2/apps/storefront/src/content/seo/guides.ts'
import { COUNTRIES } from '/home/merrick/Works/ecommerce-dashboard/v2/apps/storefront/src/content/seo/countries.ts'
import * as L from './lib'
import { background, guideScene, countryScene, genericScene, type Scene } from './scenes'

const ROOT = '/home/merrick/Works/ecommerce-dashboard/v2/apps/storefront/public'
const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const ONLY = (args.find((a) => a.startsWith('--only='))?.slice(7) ?? 'guides,pays,generic,og').split(',')
const FILTER = args.find((a) => a.startsWith('--filter='))?.slice(9)
const OUT = WRITE ? ROOT : import.meta.dir + '/preview'

const CAT: Record<string, { fr: string; en: string }> = {
  vendre: { fr: 'Vendre en ligne', en: 'Selling online' },
  publicite: { fr: 'Publicité', en: 'Advertising' },
  cod: { fr: 'Paiement à la livraison', en: 'Cash on delivery' },
  paiement: { fr: 'Paiement', en: 'Payments' },
  saisonnier: { fr: 'Saisons et fêtes', en: 'Seasons and holidays' },
  produit: { fr: 'Produits', en: 'Products' },
}
const REGION: Record<string, { fr: string; en: string }> = {
  'afrique-ouest': { fr: 'Afrique de l’Ouest', en: 'West Africa' },
  'afrique-centrale': { fr: 'Afrique centrale', en: 'Central Africa' },
  'afrique-est': { fr: 'Afrique de l’Est', en: 'East Africa' },
  'afrique-nord': { fr: 'Afrique du Nord', en: 'North Africa' },
  'afrique-australe': { fr: 'Afrique australe', en: 'Southern Africa' },
  'ocean-indien': { fr: 'Océan Indien', en: 'Indian Ocean' },
  diaspora: { fr: 'Diaspora', en: 'Diaspora' },
}

const sizes: Record<string, number[]> = {}
async function save(svg: string, file: string, kind: 'webp' | 'jpg', group: string) {
  const path = `${OUT}/${file}`
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  const img = sharp(Buffer.from(svg), { density: 72 })
  if (kind === 'webp') await img.webp({ quality: 82, effort: 4, smartSubsample: true }).toFile(path)
  else await img.jpeg({ quality: 85, mozjpeg: true }).toFile(path)
  ;(sizes[group] ??= []).push(statSync(path).size)
}

function coverSvg(sc: Scene, key: string) {
  const r = L.rng('bg:' + key)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${background(sc, r)}${sc.art}</svg>`
}

function wrap(text: string, size: number, maxW: number) {
  const words = text.replace(/ ([:;!?])/g, ' $1').split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (L.textWidth(t.replace(/ /g, ' '), size) > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines.map((l) => l.replace(/ /g, ' '))
}

function ogSvg(sc: Scene, key: string, label: string, title: string) {
  const W = 1200, H = 630
  const r = L.rng('bg:' + key)
  const dark = !!sc.dark
  const ink = dark ? '#ffffff' : L.INK
  const mid = L.id('m'), gid = L.id('fade')
  const s = 0.78
  const tx = 412, ty = H - 720 * s
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
  svg += background(sc, r, W, H)
  svg += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.49" stop-color="#000"/><stop offset="0.58" stop-color="#fff"/></linearGradient><mask id="${mid}"><rect width="${W}" height="${H}" fill="url(#${gid})"/></mask></defs>`
  svg += `<g mask="url(#${mid})"><g transform="translate(${tx} ${ty}) scale(${s})">${sc.art}</g></g>`
  // marque
  svg += `<rect x="64" y="50" width="48" height="48" rx="12" fill="#f59e0b"/>` + L.txt('Z', 88, 85, 30, L.INK, { anchor: 'middle' }) + L.txt('Zuri', 126, 85, 30, ink)
  // titre
  const maxW = 525
  let size = 58, lines = wrap(title, size, maxW)
  while ((lines.length > 3 && size > 44) || (lines.length > 4 && size > 36)) {
    size -= 2
    lines = wrap(title, size, maxW)
  }
  const lh = size * 1.16
  const labelSize = 21
  const blockH = labelSize + 26 + lines.length * lh
  const top = Math.max(150, 330 - blockH / 2)
  const labelUp = label.toLocaleUpperCase('fr')
  let ls = labelSize
  while (L.textWidth(labelUp, ls, 'b', 2) > maxW + 20 && ls > 14) ls--
  svg += L.txt(labelUp, 64, top + labelSize, ls, dark ? '#fbbf24' : '#b45309', { spacing: 2 })
  lines.forEach((l, i) => (svg += L.txt(l, 64, top + labelSize + 26 + size * 0.92 + i * lh, size, ink)))
  svg += L.txt('zurisell.store', 64, 592, 22, dark ? '#d6d3d1' : '#44403c', { weight: 'm' })
  return svg + '</svg>'
}

const want = (k: string) => !FILTER || k.includes(FILTER)

if (ONLY.includes('guides') || ONLY.includes('og')) {
  const catCount: Record<string, number> = {}
  for (const g of GUIDES) {
    const slug = g.slug.fr
    const idx = (catCount[g.category] = (catCount[g.category] ?? -1) + 1)
    if (!want(slug)) continue
    const sc = guideScene(slug, g.category, idx)
    if (ONLY.includes('guides')) await save(coverSvg(sc, slug), `img/guides/${slug}.webp`, 'webp', 'img/guides')
    if (ONLY.includes('og'))
      for (const lang of ['fr', 'en'] as const) await save(ogSvg(guideScene(slug, g.category, idx), slug, `Guide · ${CAT[g.category]![lang]}`, g.title[lang]), `og/${lang}/guides/${slug}.jpg`, 'jpg', `og/${lang}/guides`)
  }
}
if (ONLY.includes('pays') || ONLY.includes('og')) {
  for (const c of COUNTRIES) {
    if (!want(c.slug)) continue
    if (ONLY.includes('pays')) await save(coverSvg(countryScene(c.slug, c.currency.code), c.slug), `img/pays/${c.slug}.webp`, 'webp', 'img/pays')
    if (ONLY.includes('og'))
      for (const lang of ['fr', 'en'] as const) {
        const label = (lang === 'fr' ? 'Vendre par pays · ' : 'Sell by country · ') + REGION[c.region]![lang]
        await save(ogSvg(countryScene(c.slug, c.currency.code), c.slug, label, c.h1[lang]), `og/${lang}/pays/${c.slug}.jpg`, 'jpg', `og/${lang}/pays`)
      }
  }
}
if (ONLY.includes('generic')) {
  for (const k of ['alternatives', 'comparatif', 'guides', 'home', 'outils', 'pays']) {
    if (!want(k)) continue
    await save(coverSvg(genericScene(k), 'generic-' + k), `img/generic/${k}.webp`, 'webp', 'img/generic')
  }
}
for (const [k, v] of Object.entries(sizes)) console.log(k.padEnd(18), String(v.length).padStart(3), 'fichiers, moy.', (v.reduce((a, b) => a + b, 0) / v.length / 1024).toFixed(1), 'Ko, max', (Math.max(...v) / 1024).toFixed(1), 'Ko')
console.log('->', OUT)
