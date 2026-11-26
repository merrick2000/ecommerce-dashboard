/** Produits de la boutique au format /products.json de Shopify (lu par de nombreux outils du e-commerce). */
import type { APIRoute } from 'astro'
import { ApiError, apiGet } from '../../lib/api'
import { feedHeaders, shopifyProductsJson } from '../../lib/structured'
import type { StoreCatalog } from '../../lib/types'
import { absoluteUrl } from '../../lib/urls'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  let cat: StoreCatalog
  try {
    cat = await apiGet<StoreCatalog>(`/stores/${encodeURIComponent(locals.hostSlug ?? params.slug ?? '')}/catalog`)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) return new Response('{"products":[]}', { status: 404, headers: { 'content-type': 'application/json' } })
    throw e
  }
  return new Response(JSON.stringify(shopifyProductsJson(cat, (path) => absoluteUrl(locals, path))), { headers: { ...feedHeaders('application/json; charset=utf-8'), 'access-control-allow-origin': '*' } })
}
