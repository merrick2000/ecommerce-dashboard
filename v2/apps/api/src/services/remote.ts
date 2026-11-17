/**
 * Accès à Internet depuis le serveur (import de produits) : téléchargement sûr et rapatriement d'images.
 *
 * Protection SSRF : seules les adresses publiques en http(s) sont autorisées (pas de localhost,
 * réseau privé, métadonnées cloud…), chaque redirection est revérifiée, taille et durée bornées.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import sharp from 'sharp'
import { badRequest } from '../lib/errors'
import { publicUrl, putObject } from './storage'

export const IMAGE_PRESETS = {
  cover: { width: 1280, quality: 80 },
  thumbnail: { width: 600, quality: 80 },
  content: { width: 1200, quality: 78 },
  gallery: { width: 1280, quality: 80 },
} as const
export type ImagePreset = keyof typeof IMAGE_PRESETS

const UA = 'Mozilla/5.0 (compatible; ZuriImport/1.0; +https://zurisell.store)'

function privateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number) as [number, number]
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function privateIP(ip: string): boolean {
  if (isIP(ip) === 4) return privateIPv4(ip)
  const v6 = ip.toLowerCase()
  if (v6 === '::1' || v6 === '::') return true
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return privateIPv4(mapped[1]!)
  // Forme hexadécimale d'une IPv4 encapsulée (::ffff:7f00:1 = 127.0.0.1), produite par le parseur d'URL.
  const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const hi = parseInt(hex[1]!, 16)
    const lo = parseInt(hex[2]!, 16)
    return privateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  // Toute autre adresse IPv4 encapsulée / traduite : refusée par prudence.
  if (v6.startsWith('::ffff:') || v6.startsWith('64:ff9b:')) return true
  return v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb')
}

/** Vérifie qu'une URL vise un hôte public. Exporté pour les tests. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw badRequest('Adresse invalide')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw badRequest('Seules les adresses http(s) sont acceptées')
  if (url.username || url.password) throw badRequest('Adresse invalide')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) throw badRequest('Adresse non autorisée')
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true }).catch(() => [])).map((a) => a.address)
  if (!addresses.length) throw badRequest('Site introuvable')
  if (addresses.some(privateIP)) throw badRequest('Adresse non autorisée')
  return url
}

export interface FetchedResource {
  url: string
  status: number
  contentType: string
  body: Buffer
}

/** GET sûr : hôte public, 5 redirections max (revérifiées), taille et durée limitées. */
export async function safeFetch(raw: string, opts: { maxBytes?: number; timeoutMs?: number; accept?: string } = {}): Promise<FetchedResource> {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024
  const deadline = AbortSignal.timeout(opts.timeoutMs ?? 15_000)
  let current = raw
  for (let hop = 0; hop < 6; hop++) {
    const url = await assertPublicUrl(current)
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: deadline,
        headers: { 'user-agent': UA, accept: opts.accept ?? 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', 'accept-language': 'fr,en;q=0.8' },
      })
    } catch (e) {
      throw badRequest(e instanceof Error && e.name === 'TimeoutError' ? 'Le site met trop de temps à répondre' : 'Impossible de joindre ce site')
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location')!, url).toString()
      continue
    }
    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > maxBytes) throw badRequest('Contenu trop volumineux')
    // Lecture en flux avec plafond (un Content-Length absent ou mensonger ne contourne pas la limite).
    const reader = res.body?.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes) {
          await reader.cancel()
          throw badRequest('Contenu trop volumineux')
        }
        chunks.push(value)
      }
    }
    return { url: url.toString(), status: res.status, contentType: res.headers.get('content-type') ?? '', body: Buffer.concat(chunks) }
  }
  throw badRequest('Trop de redirections')
}

/** Optimise une image (WebP redimensionné) et la stocke dans le bucket public de la boutique. */
export async function storeImage(storeId: string, input: Buffer, preset: ImagePreset): Promise<{ key: string; url: string | null; size: number }> {
  const p = IMAGE_PRESETS[preset]
  let out: Buffer
  try {
    out = await sharp(input, { animated: false }).rotate().resize({ width: p.width, withoutEnlargement: true }).webp({ quality: p.quality }).toBuffer()
  } catch {
    throw badRequest('Format d’image non supporté')
  }
  const key = `stores/${storeId}/images/${crypto.randomUUID()}.webp`
  await putObject(key, out, 'image/webp', 'public-read')
  return { key, url: publicUrl(key), size: out.length }
}

/** Télécharge une image distante et la rapatrie chez nous (les images d'un autre site peuvent disparaître). */
export async function importRemoteImage(storeId: string, imageUrl: string, preset: ImagePreset): Promise<string> {
  const r = await safeFetch(imageUrl, { maxBytes: 15 * 1024 * 1024, timeoutMs: 20_000, accept: 'image/avif,image/webp,image/*;q=0.9,*/*;q=0.5' })
  if (r.status >= 400) throw badRequest(`Image inaccessible (${r.status})`)
  const stored = await storeImage(storeId, r.body, preset)
  return stored.url ?? stored.key
}
