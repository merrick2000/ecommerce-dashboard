/**
 * Rapatriement des images d'un produit importé (CSV ou URL) : 1re image = couverture (+ miniature),
 * les suivantes = galerie. Une image en échec n'empêche pas l'import (simple avertissement).
 */
import { safeFetch, storeImage } from './remote'

export interface ImportedImages {
  coverImage: string | null
  thumbnail: string | null
  gallery: string[]
  failed: string[]
}

/** Exécute des tâches avec au plus `limit` en parallèle, dans l'ordre. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i]!, i)
      }
    }),
  )
  return out
}

async function download(url: string): Promise<Buffer> {
  const r = await safeFetch(url, { maxBytes: 15 * 1024 * 1024, timeoutMs: 20_000, accept: 'image/avif,image/webp,image/*;q=0.9,*/*;q=0.5' })
  if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
  return r.body
}

async function importImagesDefault(storeId: string, urls: string[]): Promise<ImportedImages> {
  const results = await mapLimit(urls.slice(0, 12), 3, async (url, i) => {
    try {
      const body = await download(url)
      const main = await storeImage(storeId, body, i === 0 ? 'cover' : 'gallery')
      const thumb = i === 0 ? await storeImage(storeId, body, 'thumbnail') : null
      return { ok: true as const, url: main.url ?? main.key, thumb: thumb ? (thumb.url ?? thumb.key) : null }
    } catch {
      return { ok: false as const, url }
    }
  })
  // Couverture = 1re image téléchargée avec succès ; galerie = les suivantes.
  const ok = results.filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
  return {
    coverImage: ok[0]?.url ?? null,
    thumbnail: ok[0]?.thumb ?? ok[0]?.url ?? null,
    gallery: ok.slice(1).map((r) => r.url),
    failed: results.filter((r) => !r.ok).map((r) => r.url),
  }
}

/** Remplaçable en test (aucun téléchargement réel). */
export const imageImporter = { run: importImagesDefault }
