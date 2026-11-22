import sanitize from 'sanitize-html'

/**
 * Nettoie le HTML saisi par un vendeur (description, texte libre).
 * Autorise la mise en forme d'une page de vente ; supprime scripts, handlers
 * on*, iframes non vidéo et URLs javascript:. Sans ça, un vendeur pourrait
 * voler les données des clients des autres boutiques (même origine).
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'data-cta'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
      '*': ['class', 'style', 'data-align'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i],
        'text-align': [/^(left|right|center|justify)$/],
        'font-weight': [/^\d{3}$|^bold$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer nofollow', ...(attribs.target ? { target: '_blank' } : {}) },
      }),
    },
  })
}

/** Échappe une valeur pour un contexte HTML texte (emails, Telegram). */
export function escapeHtml(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)
}

const FONT_HOST = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//i

/**
 * CSS d'une page libre : retire ce qui peut exécuter du code ou espionner la saisie
 * (sélecteurs sur la valeur des champs, @import hors Google Fonts, expression(), -moz-binding).
 */
export function sanitizeCss(css: string): string {
  return css
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/@import\s+(?:url\()?\s*["']?([^"');\s]+)["']?\s*\)?[^;]*;/gi, (m, url: string) => (FONT_HOST.test(url) ? m : ''))
    .replace(/expression\s*\(/gi, '(')
    .replace(/-moz-binding\s*:[^;}]*/gi, '')
    .replace(/behavior\s*:[^;}]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/[^{}]*\[\s*value[^{}]*\{[^}]*\}/gi, '')
    .slice(0, 300_000)
}

/**
 * Page HTML libre collée par un vendeur (souvent générée par une IA ou un constructeur de pages).
 * On garde la structure, les classes, les styles, les polices Google et Tailwind ; on retire scripts,
 * formulaires étrangers (hameçonnage), iframes non vidéo, gestionnaires on* et URLs javascript:.
 * Les repères {{…}} sont du texte : ils traversent le nettoyage et sont remplacés au rendu.
 */
export function sanitizeCustomPage(raw: string): { html: string; css: string; fonts: string[]; tailwind: boolean } {
  const tailwind = /cdn\.tailwindcss\.com|tailwindcss/i.test(raw) && /<script[^>]+tailwind/i.test(raw)
  const fonts = [...raw.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]!).filter((u) => FONT_HOST.test(u)).slice(0, 10)
  const css: string[] = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]!)
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  let body = bodyMatch ? bodyMatch[1]! : raw.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<\/?(html|!doctype)[^>]*>/gi, '')
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const svgAttrs = ['viewbox', 'viewBox', 'fill', 'stroke', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'points', 'offset', 'stop-color', 'stop-opacity', 'transform', 'xmlns', 'fill-rule', 'clip-rule', 'opacity', 'gradientUnits', 'preserveAspectRatio']
  const html = sanitize(body, {
    allowedTags: [
      'section', 'header', 'footer', 'nav', 'main', 'article', 'aside', 'div', 'span', 'p', 'br', 'hr',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'small', 'sup', 'sub', 'code', 'pre', 'blockquote', 'q', 'cite',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'img', 'picture', 'source', 'figure', 'figcaption', 'video', 'audio', 'iframe',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'details', 'summary', 'button', 'label', 'time',
      'svg', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'lineargradient', 'radialgradient', 'stop', 'title',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'data-cta'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'type', 'media', 'sizes'],
      video: ['src', 'poster', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'width', 'height', 'preload'],
      audio: ['src', 'controls', 'loop', 'preload'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
      button: ['type'],
      time: ['datetime'],
      svg: svgAttrs, path: svgAttrs, circle: svgAttrs, ellipse: svgAttrs, rect: svgAttrs, line: svgAttrs, polyline: svgAttrs, polygon: svgAttrs, g: svgAttrs, lineargradient: svgAttrs, radialgradient: svgAttrs, stop: svgAttrs,
      '*': ['class', 'id', 'style', 'title', 'role', 'aria-*', 'data-*', 'lang', 'dir', 'hidden'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'whatsapp'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'], source: ['http', 'https'] },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.facebook.com', 'www.tiktok.com'],
    // Styles en ligne gardés tels quels (sans JavaScript possible dans le CSS des navigateurs actuels) ; url(javascript:) retiré plus bas.
    allowVulnerableTags: false,
    parseStyleAttributes: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, ...(attribs.target ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } }),
      button: (_tagName, attribs) => ({ tagName: 'button', attribs: { ...attribs, type: 'button' } }),
    },
  }).replace(/javascript\s*:/gi, '')
  return { html, css: sanitizeCss(css.join('\n')), fonts, tailwind }
}
