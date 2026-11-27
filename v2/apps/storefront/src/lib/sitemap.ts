/**
 * Plan du site au format imposé : /sitemap.xml est un index qui liste un fichier par type de page
 * (/sitemaps/<type>.xml) ; chaque <url> a loc, lastmod (date réelle), changefreq, priority, une balise par ligne.
 * Aucun espace de noms en plus (les liens de langue sont dans le <head> de chaque page).
 */
export type Changefreq = 'daily' | 'weekly' | 'monthly'
export interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: Changefreq
  priority: string
}

const FALLBACK = '2026-11-24T00:00:00.000Z'

/** Date réelle d'un type de contenu, au format ISO (…T…Z). */
export function contentDate(key: string): string {
  const raw = (typeof __CONTENT_DATES__ !== 'undefined' ? __CONTENT_DATES__[key] : null) ?? FALLBACK
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? FALLBACK : d.toISOString()
}

export const isoDate = (v: string | Date) => {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? FALLBACK : d.toISOString()
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function urlsetXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${esc(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

export function sitemapIndexXml(files: { loc: string; lastmod: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files
  .map(
    (f) => `  <sitemap>
    <loc>${esc(f.loc)}</loc>
    <lastmod>${f.lastmod}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>
`
}

export const latest = (entries: { lastmod: string }[]) => entries.reduce((m, e) => (e.lastmod > m ? e.lastmod : m), FALLBACK)

export const xmlHeaders = { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, must-revalidate' }
