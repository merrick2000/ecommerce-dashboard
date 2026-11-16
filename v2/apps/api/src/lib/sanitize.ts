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
