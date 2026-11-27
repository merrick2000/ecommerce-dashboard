/** Plan du site d'une boutique : accueil et pages de vente, dates réelles (mise à jour des produits). */
import { ApiError, apiGet } from './api'
import { isoDate, latest, type SitemapEntry } from './sitemap'
import type { StoreCatalog } from './types'
import { canonicalStoreUrl } from './urls'

export async function storeCatalogOrNull(slug: string): Promise<StoreCatalog | null> {
  try {
    return await apiGet<StoreCatalog>(`/stores/${encodeURIComponent(slug)}/catalog`)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) return null
    throw e
  }
}

export function storeSitemaps(locals: App.Locals, cat: StoreCatalog): Record<string, SitemapEntry[]> {
  const products: SitemapEntry[] = cat.items.map((i) => ({ loc: canonicalStoreUrl(locals, cat.store, i.path), lastmod: isoDate(i.updatedAt), changefreq: 'weekly', priority: '0.8' }))
  return {
    pages: [{ loc: canonicalStoreUrl(locals, cat.store, '/'), lastmod: products.length ? latest(products) : isoDate(new Date('2026-11-24')), changefreq: 'daily', priority: '1.0' }],
    produits: products,
  }
}
