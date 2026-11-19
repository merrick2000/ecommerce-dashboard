import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const prerender = false

/** Site marketing indexable ; pages de commande et aperçus exclus (déjà en noindex). */
export const GET: APIRoute = () => {
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  const body = `User-agent: *
Allow: /
Disallow: /*/order/
Disallow: /*/apercu
Sitemap: ${base}/sitemap.xml
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
