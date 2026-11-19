/** Plan du site marketing au format sitemaps.org standard (lisible, une balise par ligne). Les liens de langue sont dans chaque page (hreflang). */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { ALTERNATIVES, COMPARISONS, COUNTRIES, GUIDES, PATHS, alternativePath, comparisonPath, countryPath, guidePath } from '../content/seo'
import { TOOLS } from '../content/seo/tools'

export const prerender = false

/** Date de dernière mise à jour des contenus (à changer quand les contenus évoluent). */
const LASTMOD = '2026-11-19T00:00:00.000Z'

type Entry = { path: string; changefreq: 'daily' | 'weekly' | 'monthly'; priority: string }

export const GET: APIRoute = () => {
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  const both = (fr: string, en: string, changefreq: Entry['changefreq'], priority: string): Entry[] => [
    { path: fr, changefreq, priority },
    { path: en, changefreq, priority },
  ]
  const entries: Entry[] = [
    ...both(PATHS.home.fr, PATHS.home.en, 'daily', '1'),
    ...both(PATHS.guides.fr, PATHS.guides.en, 'weekly', '0.9'),
    ...both(PATHS.tools.fr, PATHS.tools.en, 'weekly', '0.9'),
    ...both(PATHS.countries.fr, PATHS.countries.en, 'weekly', '0.8'),
    ...both(PATHS.alternatives.fr, PATHS.alternatives.en, 'weekly', '0.8'),
    ...both(PATHS.comparisons.fr, PATHS.comparisons.en, 'weekly', '0.7'),
    ...TOOLS.flatMap((x) => both(`${PATHS.tools.fr}/${x.slug.fr}`, `${PATHS.tools.en}/${x.slug.en}`, 'monthly', '0.8')),
    ...GUIDES.flatMap((g) => both(guidePath(g.slug.fr, 'fr'), guidePath(g.slug.en, 'en'), 'monthly', '0.8')),
    ...COUNTRIES.flatMap((c) => both(countryPath(c.slug, 'fr'), countryPath(c.slug, 'en'), 'monthly', '0.7')),
    ...ALTERNATIVES.flatMap((a) => both(alternativePath(a.slug, 'fr'), alternativePath(a.slug, 'en'), 'monthly', '0.7')),
    ...COMPARISONS.flatMap((c) => both(comparisonPath(c.slug, 'fr'), comparisonPath(c.slug, 'en'), 'monthly', '0.6')),
  ]
  const loc = (p: string) => `${base}${p}`
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${loc(e.path)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, must-revalidate' } })
}
