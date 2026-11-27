/** Un fichier du plan du site marketing : toutes les pages d'un type (guides, pays, villes…). */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { urlsetXml, xmlHeaders } from '../../lib/sitemap'
import { MARKETING_SITEMAPS } from '../../lib/sitemap-marketing'

export const prerender = false

export const GET: APIRoute = ({ params }) => {
  const group = MARKETING_SITEMAPS[params.type ?? '']
  if (!group) return new Response('Not found', { status: 404 })
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  return new Response(urlsetXml(group.entries(base)), { headers: xmlHeaders })
}
