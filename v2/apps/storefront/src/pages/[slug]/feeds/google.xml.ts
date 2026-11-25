/**
 * Flux produits de la boutique au format Google Merchant Center (RSS 2.0, espace g:).
 * Le même lien s'utilise dans le gestionnaire de catalogue Meta (Facebook, Instagram) et sur TikTok Shop.
 */
import type { APIRoute } from 'astro'
import { ApiError, apiGet } from '../../../lib/api'
import { feedHeaders, googleFeedXml } from '../../../lib/structured'
import type { StoreCatalog } from '../../../lib/types'
import { absoluteUrl } from '../../../lib/urls'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  let cat: StoreCatalog
  try {
    cat = await apiGet<StoreCatalog>(`/stores/${encodeURIComponent(params.slug ?? '')}/catalog`)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) return new Response('Not found', { status: 404 })
    throw e
  }
  return new Response(googleFeedXml(cat, absoluteUrl(locals, '/'), (path) => absoluteUrl(locals, path)), { headers: feedHeaders('application/xml; charset=utf-8') })
}
