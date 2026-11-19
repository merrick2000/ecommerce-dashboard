/** Plan du site marketing (français et anglais, avec liens hreflang). */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { ALTERNATIVES, COMPARISONS, COUNTRIES, GUIDES, PATHS, alternativePath, comparisonPath, countryPath, guidePath } from '../content/seo'

export const prerender = false

export const GET: APIRoute = () => {
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  const pairs: { fr: string; en: string; priority: string }[] = [
    { fr: PATHS.home.fr, en: PATHS.home.en, priority: '1.0' },
    { fr: PATHS.countries.fr, en: PATHS.countries.en, priority: '0.8' },
    { fr: PATHS.guides.fr, en: PATHS.guides.en, priority: '0.8' },
    { fr: PATHS.alternatives.fr, en: PATHS.alternatives.en, priority: '0.8' },
    { fr: PATHS.comparisons.fr, en: PATHS.comparisons.en, priority: '0.7' },
    ...COUNTRIES.map((c) => ({ fr: countryPath(c.slug, 'fr'), en: countryPath(c.slug, 'en'), priority: '0.7' })),
    ...GUIDES.map((g) => ({ fr: guidePath(g.slug.fr, 'fr'), en: guidePath(g.slug.en, 'en'), priority: '0.7' })),
    ...ALTERNATIVES.map((a) => ({ fr: alternativePath(a.slug, 'fr'), en: alternativePath(a.slug, 'en'), priority: '0.7' })),
    ...COMPARISONS.map((c) => ({ fr: comparisonPath(c.slug, 'fr'), en: comparisonPath(c.slug, 'en'), priority: '0.6' })),
  ]
  const url = (loc: string, p: { fr: string; en: string; priority: string }) =>
    `<url><loc>${base}${loc}</loc><xhtml:link rel="alternate" hreflang="fr" href="${base}${p.fr}"/><xhtml:link rel="alternate" hreflang="en" href="${base}${p.en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${base}${p.fr}"/><priority>${p.priority}</priority></url>`
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pairs.flatMap((p) => [url(p.fr, p), url(p.en, p)]).join('\n')}
</urlset>`
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
