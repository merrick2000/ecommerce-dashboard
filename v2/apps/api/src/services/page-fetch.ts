/**
 * Récupération d'une page produit, en deux étages :
 * 1. lecture directe (en-têtes de navigateur) : instantanée et gratuite, suffit pour la plupart des boutiques ;
 * 2. Firecrawl (si FIRECRAWL_API_KEY) : navigateur réel, JavaScript exécuté, proxys anti-blocage,
 *    pour AliExpress, Amazon, Temu, les sites derrière Cloudflare ou rendus en JavaScript.
 */
import { env } from '../lib/env'
import { decrypt } from '../lib/crypto'
import { getSetting } from './platform'
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

/** Clé Firecrawl : réglée par le super admin (chiffrée en base), sinon FIRECRAWL_API_KEY. Mise en cache 1 min. */
let keyCache: { value: string | null; at: number } | null = null
export async function firecrawlKey(): Promise<string | null> {
  if (keyCache && Date.now() - keyCache.at < 60_000) return keyCache.value
  let value: string | null = null
  try {
    const stored = await getSetting<string | null>('firecrawl.key', null)
    value = stored ? decrypt(stored) : null
  } catch {
    value = null
  }
  value ||= env.FIRECRAWL_API_KEY ?? null
  keyCache = { value, at: Date.now() }
  return value
}
export const resetFirecrawlKeyCache = () => {
  keyCache = null
}
export const firecrawlAvailable = async () => Boolean(await firecrawlKey())

/**
 * Signes d'une page de blocage ou de vérification plutôt que de la vraie page produit.
 * Prudent : une vraie page contient souvent « recaptcha » dans ses scripts, on regarde donc le titre
 * et on ne cherche les marqueurs anti-robot que dans les petites pages (les pages de défi sont légères).
 */
export function looksBlocked(page: Pick<FetchedPage, 'status' | 'html'> & { url?: string }): boolean {
  if (page.status >= 400 || page.status === 202) return true
  if (page.url && /\/(login|signin|sign-in|connexion|account\/login|ap\/signin)(\.html)?([/?#]|$)/i.test(new URL(page.url).pathname)) return true
  const html = page.html
  const structured = /application\/ld\+json|property=["']og:title/i.test(html.slice(0, 400_000))
  if (html.length < 4000 && !structured) return true
  const title = html.match(/<title[^>]*>([^<]{0,200})/i)?.[1] ?? ''
  if (/just a moment|attention required|access denied|accès refusé|robot|captcha|security check|verify you are|pardon our interruption|are you a human|un instant|\bconnexion\b|\blog ?in\b|sign in/i.test(title)) return true
  if (html.length < 60_000 && !structured && /cf-challenge|challenge-platform|px-captcha|_Incapsula_Resource|datadome|captcha-delivery|perimeterx/i.test(html)) return true
  return false
}

export async function fetchDirect(url: string): Promise<FetchedPage> {
  const r = await safeFetch(url, { maxBytes: 6 * 1024 * 1024, timeoutMs: 15_000, browser: true })
  return { url: r.url, status: r.status, contentType: r.contentType, html: r.body.toString('utf8'), markdown: null, via: 'direct' }
}

/** Fiche produit structurée détectée par Firecrawl (format « product » : JSON-LD, état embarqué, AliExpress…). */
export interface FirecrawlProduct {
  title?: string
  brand?: string
  category?: string
  url?: string
  description?: string
  variants?: {
    id?: string
    sku?: string
    title?: string
    values?: Record<string, string>
    price?: { amount?: number; currency?: string }
    sale?: { originalPrice?: { amount?: number } | number }
    availability?: { inStock?: boolean }
    images?: { url?: string }[]
  }[]
}

interface FirecrawlResponse {
  success?: boolean
  error?: string
  code?: string
  data?: { rawHtml?: string; html?: string; markdown?: string; product?: FirecrawlProduct; warning?: string; metadata?: { statusCode?: number; url?: string; sourceURL?: string; contentType?: string } }
}

export class FirecrawlError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

/**
 * Firecrawl /v2/scrape. Réglages éprouvés sur AliExpress, Amazon, Decathlon :
 * - waitFor 5 s : les prix et variantes de ces sites s'affichent après chargement (JavaScript) ;
 * - format « product » : fiche structurée sans IA ; rawHtml + markdown pour nos extracteurs et l'IA ;
 * - location FR / français : pages et prix en français ; proxy « auto » (défaut) : proxys renforcés si blocage ;
 * - maxAge 1 h : un aperçu relancé dans l'heure ne recoûte pas une visite.
 * Une nouvelle tentative sur 408 / 429 / 5xx (erreurs passagères selon la doc Firecrawl).
 */
/** Redirigé vers l'accueil ou la connexion au lieu de la page demandée : blocage déguisé (Amazon, Temu…). */
export function softBlocked(requested: string, page: FetchedPage): boolean {
  try {
    const want = new URL(requested)
    const got = new URL(page.url)
    if (want.pathname.length > 1 && (got.pathname === '/' || got.pathname === '')) return true
  } catch {
    /* URL illisible : on laisse les autres contrôles décider */
  }
  return looksBlocked(page)
}

export async function fetchWithFirecrawl(url: string): Promise<FetchedPage & { product: FirecrawlProduct | null }> {
  const first = await scrapeOnce(url, 3_600_000)
  if (!softBlocked(url, first)) return first
  // Seconde visite sans cache : nouveau proxy, et on ne ressert pas un mauvais résultat mis en cache.
  console.warn('[firecrawl] page bloquée ou redirigée, nouvelle visite sans cache', url, '→', first.url)
  try {
    const second = await scrapeOnce(url, 0)
    return softBlocked(url, second) && !second.product ? first : second
  } catch {
    return first
  }
}

async function scrapeOnce(url: string, maxAge: number): Promise<FetchedPage & { product: FirecrawlProduct | null }> {
  const key = await firecrawlKey()
  if (!key) throw new FirecrawlError('Firecrawl non configuré', 0)
  // L'URL doit rester publique (même si c'est Firecrawl qui la visite).
  await assertPublicUrl(url)
  const body = JSON.stringify({
    url,
    formats: ['rawHtml', 'markdown', 'product'],
    onlyMainContent: false,
    waitFor: 5000,
    timeout: 90_000,
    blockAds: true,
    maxAge,
    location: { country: 'FR', languages: ['fr-FR', 'fr'] },
  })
  let last: FirecrawlError | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response
    try {
      res = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(100_000),
      })
    } catch (e) {
      last = new FirecrawlError(`Firecrawl injoignable : ${(e as Error).message}`, 0)
      continue
    }
    const json = (await res.json().catch(() => null)) as FirecrawlResponse | null
    if (res.ok && json?.success && json.data) {
      const d = json.data
      return {
        url: d.metadata?.url ?? d.metadata?.sourceURL ?? url,
        status: d.metadata?.statusCode ?? 200,
        contentType: d.metadata?.contentType ?? 'text/html',
        html: d.rawHtml ?? d.html ?? '',
        markdown: d.markdown ?? null,
        product: d.product ?? null,
        via: 'firecrawl',
      }
    }
    last = new FirecrawlError(`Firecrawl ${res.status}: ${json?.error ?? 'réponse vide'}`, res.status)
    // 402 (crédits épuisés), 401, 400, 403 : inutile de réessayer.
    if (![408, 429, 500, 502, 503, 504].includes(res.status)) break
    await new Promise((r) => setTimeout(r, Math.min(Number(res.headers.get('retry-after') ?? 2) * 1000, 5000)))
  }
  if (last?.status === 402) console.error('[firecrawl] crédits épuisés : recharger le compte Firecrawl')
  throw last ?? new FirecrawlError('Firecrawl : échec', 0)
}
