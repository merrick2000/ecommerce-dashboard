/** Index du plan du site marketing : un fichier par type de page (/sitemaps/<type>.xml), avec sa date réelle. */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { latest, sitemapIndexXml, xmlHeaders } from '../lib/sitemap'
import { MARKETING_SITEMAPS } from '../lib/sitemap-marketing'

export const prerender = false

export const GET: APIRoute = () => {
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  const files = Object.entries(MARKETING_SITEMAPS).map(([type, g]) => ({ loc: `${base}/sitemaps/${type}.xml`, lastmod: latest(g.entries(base)) }))
  return new Response(sitemapIndexXml(files), { headers: xmlHeaders })
}
