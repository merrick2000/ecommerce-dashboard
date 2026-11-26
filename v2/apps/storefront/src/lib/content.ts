/**
 * Transformations HTML côté serveur (le HTML est déjà nettoyé par l'API) :
 * insertion des CTA dans la description, images paresseuses, extrait SEO, vidéo.
 */
import type { ProductContent } from '@zuri/shared'

type DescriptionCta = ProductContent['descriptionCtas'][number]

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Les images de la description ne doivent jamais concurrencer l'image principale. */
export function lazyImages(html: string): string {
  return html.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"')
}

const BLOCK_RE = /(<(p|h[1-6]|ul|ol|blockquote|div|figure|table|pre)\b[^>]*>[\s\S]*?<\/\2>|<hr\b[^>]*\/?>|<img\b[^>]*\/?>)/gi

/** Découpe la description en blocs de premier niveau (paragraphes, titres, listes…). */
export function splitBlocks(html: string): string[] {
  const blocks: string[] = []
  let last = 0
  for (const m of html.matchAll(BLOCK_RE)) {
    const before = html.slice(last, m.index).trim()
    if (before) blocks.push(before)
    blocks.push(m[0])
    last = m.index! + m[0].length
  }
  const rest = html.slice(last).trim()
  if (rest) blocks.push(rest)
  return blocks
}

export function ctaHtml(cta: DescriptionCta): string {
  const href = cta.action === 'custom_url' && cta.url ? escapeHtml(cta.url) : '#commander'
  const ext = cta.action === 'custom_url' && cta.url ? ' rel="nofollow noopener" target="_blank"' : ''
  const sub = cta.subText ? `<span class="cta-sub">${escapeHtml(cta.subText)}</span>` : ''
  return `<div class="dcta dcta-${cta.alignment}"><a class="btn cta-${cta.style}" data-cta="description" href="${href}"${ext}>${escapeHtml(cta.text)}</a>${sub}</div>`
}

const SLOT_RE = /<div\b[^>]*\bdata-cta-slot="([a-z0-9]{4,16})"[^>]*>\s*<\/div>/gi
const isSlot = (block: string) => /^<div\b[^>]*\bdata-cta-slot=/i.test(block)

/**
 * Boutons de la description. Un bouton glissé dans le texte (emplacement data-cta-slot) s'affiche à cet endroit ;
 * les autres après le paragraphe N (0 = avant le premier, > nb blocs = à la fin). Emplacement sans bouton : retiré.
 */
export function descriptionWithCtas(html: string, ctas: DescriptionCta[]): string {
  const clean = lazyImages(html || '')
  const byId = new Map(ctas.filter((c) => c.id).map((c) => [c.id!, c]))
  const placed = new Set([...clean.matchAll(SLOT_RE)].map((m) => m[1]!).filter((id) => byId.has(id)))
  const rest = ctas.filter((c) => !c.id || !placed.has(c.id))
  let out = clean
  if (rest.length) {
    const blocks = splitBlocks(clean)
    const sorted = [...rest].sort((a, b) => a.afterParagraph - b.afterParagraph)
    const parts: string[] = sorted.filter((c) => c.afterParagraph === 0).map(ctaHtml)
    let n = 0
    for (const b of blocks) {
      parts.push(b)
      // Les emplacements de boutons ne comptent pas comme des paragraphes.
      if (isSlot(b)) continue
      n++
      for (const c of sorted) if (c.afterParagraph === n) parts.push(ctaHtml(c))
    }
    for (const c of sorted) if (c.afterParagraph > n) parts.push(ctaHtml(c))
    out = parts.join('\n')
  }
  return out.replace(SLOT_RE, (_, id: string) => (byId.has(id) ? ctaHtml(byId.get(id)!) : ''))
}

/** Premier texte de la description, pour la meta description. */
export function excerpt(html: string, max = 160): string {
  const text = (html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text
}

export type VideoEmbed = { kind: 'youtube' | 'vimeo'; id: string; embed: string; thumb: string | null } | { kind: 'file'; src: string }

export function parseVideo(url: string): VideoEmbed | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    let yt: string | null = null
    if (host === 'youtu.be') yt = u.pathname.slice(1)
    else if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      yt = u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ?? null
    }
    if (yt && /^[\w-]{6,20}$/.test(yt)) {
      return { kind: 'youtube', id: yt, embed: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` }
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.match(/(\d{5,})/)?.[1]
      if (id) return { kind: 'vimeo', id, embed: `https://player.vimeo.com/video/${id}?autoplay=1`, thumb: null }
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u.pathname)) return { kind: 'file', src: url }
  } catch {
    /* URL invalide */
  }
  return null
}

/** Couleur de texte lisible sur la couleur principale. */
export function onColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#ffffff'
  const n = parseInt(m[1]!, 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.4 ? '#111111' : '#ffffff'
}

export const safeColor = (hex: string | null | undefined, fallback = '#f59e0b') => (hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback)

/** URL wa.me avec message prérempli (chiffres uniquement). */
export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '').replace(/^00/, '')}?text=${encodeURIComponent(text)}`
}

/** JSON sûr dans un <script type="application/json">. */
export const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
