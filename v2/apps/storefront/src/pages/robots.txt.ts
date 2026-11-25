import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const prerender = false

/** Site marketing indexable ; pages de commande et aperçus exclus (déjà en noindex). */
export const GET: APIRoute = ({ request }) => {
  const platform = env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'
  const host = new URL(request.url).hostname
  // Domaine d'une boutique (sous-domaine ou domaine perso) : son propre plan du site et son flux produits.
  if (host !== platform && host !== `www.${platform}` && host !== 'localhost' && !host.startsWith('127.')) {
    const origin = `https://${host}`
    return new Response(`User-agent: *\nAllow: /\nDisallow: /order/\nDisallow: /*/apercu\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
  }
  const base = `https://${platform}`
  const body = `User-agent: *
Allow: /
Disallow: /*/order/
Disallow: /*/apercu
Sitemap: ${base}/sitemap.xml
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
