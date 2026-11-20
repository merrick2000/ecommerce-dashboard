/**
 * Récupération d'une page produit, en deux étages :
 * 1. lecture directe (en-têtes de navigateur) : instantanée et gratuite, suffit pour la plupart des boutiques ;
 * 2. Firecrawl (si FIRECRAWL_API_KEY) : navigateur réel, JavaScript exécuté, proxys anti-blocage,
 *    pour AliExpress, Amazon, Temu, les sites derrière Cloudflare ou rendus en JavaScript.
 */
import { env } from '../lib/env'
import { assertPublicUrl, safeFetch } from './remote'

export interface FetchedPage {
  url: string
  status: number
  contentType: string
  html: string
  /** Texte lisible de la page (Firecrawl), utile à l'extraction par IA. */
  markdown: string | null
  via: 'direct' | 'firecrawl'
}

export const firecrawlAvailable = () => Boolean(env.FIRECRAWL_API_KEY)

/**
 * Signes d'une page de blocage ou de vérification plutôt que de la vraie page produit.
 * Prudent : une vraie page contient souvent « recaptcha » dans ses scripts, on regarde donc le titre
 * et on ne cherche les marqueurs anti-robot que dans les petites pages (les pages de défi sont légères).
 */
export function looksBlocked(page: Pick<FetchedPage, 'status' | 'html'>): boolean {
  if (page.status >= 400 || page.status === 202) return true
  const html = page.html
  const structured = /application\/ld\+json|property=["']og:title/i.test(html.slice(0, 400_000))
  if (html.length < 4000 && !structured) return true
  const title = html.match(/<title[^>]*>([^<]{0,200})/i)?.[1] ?? ''
  if (/just a moment|attention required|access denied|accès refusé|robot|captcha|security check|verify you are|pardon our interruption|are you a human|un instant/i.test(title)) return true
  if (html.length < 60_000 && !structured && /cf-challenge|challenge-platform|px-captcha|_Incapsula_Resource|datadome|captcha-delivery|perimeterx/i.test(html)) return true
  return false
}

export async function fetchDirect(url: string): Promise<FetchedPage> {
  const r = await safeFetch(url, { maxBytes: 6 * 1024 * 1024, timeoutMs: 15_000, browser: true })
  return { url: r.url, status: r.status, contentType: r.contentType, html: r.body.toString('utf8'), markdown: null, via: 'direct' }
}

interface FirecrawlResponse {
  success?: boolean
  error?: string
  data?: { rawHtml?: string; html?: string; markdown?: string; metadata?: { statusCode?: number; url?: string; sourceURL?: string; contentType?: string } }
}

export async function fetchWithFirecrawl(url: string): Promise<FetchedPage> {
  if (!env.FIRECRAWL_API_KEY) throw new Error('Firecrawl non configuré')
  // L'URL doit rester publique (même si c'est Firecrawl qui la visite).
  await assertPublicUrl(url)
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      formats: ['rawHtml', 'markdown'],
      onlyMainContent: false,
      proxy: 'auto',
      blockAds: true,
      waitFor: 1500,
      timeout: 60_000,
      location: { country: 'FR', languages: ['fr-FR', 'fr', 'en'] },
    }),
    signal: AbortSignal.timeout(75_000),
  })
  const body = (await res.json().catch(() => null)) as FirecrawlResponse | null
  if (!res.ok || !body?.success || !body.data) throw new Error(`Firecrawl ${res.status}: ${body?.error ?? 'réponse vide'}`)
  const d = body.data
  return {
    url: d.metadata?.url ?? d.metadata?.sourceURL ?? url,
    status: d.metadata?.statusCode ?? 200,
    contentType: d.metadata?.contentType ?? 'text/html',
    html: d.rawHtml ?? d.html ?? '',
    markdown: d.markdown ?? null,
    via: 'firecrawl',
  }
}
