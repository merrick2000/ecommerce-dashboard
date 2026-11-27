/** Un fichier du plan du site d'une boutique (pages ou produits). */
import type { APIRoute } from 'astro'
import { urlsetXml, xmlHeaders } from '../../../lib/sitemap'
import { storeCatalogOrNull, storeSitemaps } from '../../../lib/sitemap-store'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  const cat = await storeCatalogOrNull(locals.hostSlug ?? params.slug ?? '')
  if (!cat) return new Response('Not found', { status: 404 })
  const entries = storeSitemaps(locals, cat)[params.type ?? '']
  if (!entries) return new Response('Not found', { status: 404 })
  return new Response(urlsetXml(entries), { headers: xmlHeaders })
}
