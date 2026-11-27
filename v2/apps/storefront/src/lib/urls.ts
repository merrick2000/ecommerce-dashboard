import { env } from 'cloudflare:workers'

/** Lien interne selon l'hôte : '/p/12' sur un domaine boutique, '/ma-boutique/p/12' sur la plateforme. */
export function storeUrl(locals: App.Locals, path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!locals.storeBase) return p
  return p === '/' ? locals.storeBase : `${locals.storeBase}${p}`
}

/** URL absolue publique (canonical, og:url). */
export function absoluteUrl(locals: App.Locals, path: string): string {
  return `${locals.publicOrigin}${storeUrl(locals, path)}`
}

/** Image redimensionnée via Cloudflare Image Resizing si activé sur la zone, sinon l'URL d'origine. */
export function img(url: string | null | undefined, width: number): string | null {
  if (!url) return null
  if (env.IMAGE_RESIZING === 'cloudflare' && /^https?:\/\//.test(url)) return `/cdn-cgi/image/width=${width},quality=75,format=auto,fit=scale-down/${url}`
  return url
}

export function imgSrcset(url: string | null | undefined, widths: number[]): string | undefined {
  if (!url || env.IMAGE_RESIZING !== 'cloudflare') return undefined
  return widths.map((w) => `${img(url, w)} ${w}w`).join(', ')
}

export function originOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

type CanonicalStore = { canonicalHost?: string }
const isLocalHost = (h: string) => /^(localhost|127\.|0\.0\.0\.0)/.test(h)

/** URL officielle (canonique) d'une page de boutique : une seule adresse par contenu. En local : l'adresse courante. */
export function canonicalStoreUrl(locals: App.Locals, store: CanonicalStore, path: string): string {
  const host = new URL(locals.publicOrigin).host
  if (import.meta.env.DEV || !store.canonicalHost || isLocalHost(host)) return absoluteUrl(locals, path)
  const p = path.startsWith('/') ? path : `/${path}`
  return `https://${store.canonicalHost}${p}`
}

/** Page de boutique ouverte ailleurs qu'à son adresse officielle : URL de redirection 301 (sinon null). */
export function canonicalRedirect(locals: App.Locals, store: CanonicalStore, path: string, search: string): string | null {
  const host = new URL(locals.publicOrigin).host
  if (import.meta.env.DEV || !store.canonicalHost || isLocalHost(host) || host === store.canonicalHost) return null
  return canonicalStoreUrl(locals, store, path) + search
}
