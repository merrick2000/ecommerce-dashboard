/** Index du plan du site d'une boutique : /sitemaps/pages.xml (accueil) et /sitemaps/produits.xml (pages de vente). */
import type { APIRoute } from 'astro'
import { latest, sitemapIndexXml, xmlHeaders } from '../../lib/sitemap'
import { storeCatalogOrNull, storeSitemaps } from '../../lib/sitemap-store'
import { canonicalStoreUrl } from '../../lib/urls'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  const cat = await storeCatalogOrNull(locals.hostSlug ?? params.slug ?? '')
  if (!cat) return new Response('Not found', { status: 404 })
  const groups = storeSitemaps(locals, cat)
  const files = Object.entries(groups)
    .filter(([, e]) => e.length)
    .map(([type, e]) => ({ loc: canonicalStoreUrl(locals, cat.store, `/sitemaps/${type}.xml`), lastmod: latest(e) }))
  return new Response(sitemapIndexXml(files), { headers: xmlHeaders })
}
