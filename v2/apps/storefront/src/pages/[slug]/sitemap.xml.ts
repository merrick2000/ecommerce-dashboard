/** Plan du site d'une boutique : accueil et pages de vente, avec date de mise à jour et image principale. */
import type { APIRoute } from 'astro'
import { ApiError, apiGet } from '../../lib/api'
import type { StoreCatalog } from '../../lib/types'
import { absoluteUrl } from '../../lib/urls'

export const prerender = false

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const GET: APIRoute = async ({ params, locals }) => {
  let cat: StoreCatalog
  try {
    cat = await apiGet<StoreCatalog>(`/stores/${encodeURIComponent(locals.hostSlug ?? params.slug ?? '')}/catalog`)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) return new Response('Not found', { status: 404 })
    throw e
  }
  const last = cat.items.reduce((m, i) => (i.updatedAt > m ? i.updatedAt : m), '')
  const urls = [
    `  <url>\n    <loc>${esc(absoluteUrl(locals, '/'))}</loc>${last ? `\n    <lastmod>${last.slice(0, 10)}</lastmod>` : ''}\n  </url>`,
    ...cat.items.map(
      (i) =>
        `  <url>\n    <loc>${esc(absoluteUrl(locals, i.path))}</loc>\n    <lastmod>${i.updatedAt.slice(0, 10)}</lastmod>${i.images[0] ? `\n    <image:image><image:loc>${esc(i.images[0])}</image:loc></image:image>` : ''}\n  </url>`,
    ),
  ]
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
