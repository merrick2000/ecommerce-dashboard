/** Pages du site marketing, regroupées par type pour le plan du site (un fichier par type). */
import { ALTERNATIVES, BEST_PAGES, CITIES, COMBOS, COMPARISONS, COUNTRIES, GUIDES, NICHES, PATHS, alternativePath, bestPath, cityPath, comboPath, comparisonPath, countryPath, guidePath, helpPath, nichePath, toolPath } from '../content/seo'
import { CHANGELOG } from '../content/seo/changelog'
import { HELP } from '../content/seo/help'
import { TOOLS } from '../content/seo/tools'
import { contentDate, isoDate, type Changefreq, type SitemapEntry } from './sitemap'

type Group = { title: string; entries: (base: string) => SitemapEntry[] }

const both = (base: string, fr: string, en: string, lastmod: string, changefreq: Changefreq, priority: string): SitemapEntry[] => [
  { loc: `${base}${fr}`, lastmod, changefreq, priority },
  { loc: `${base}${en}`, lastmod, changefreq, priority },
]

export const MARKETING_SITEMAPS: Record<string, Group> = {
  pages: {
    title: 'Pages principales',
    entries: (b) => {
      const d = contentDate('static')
      const news = CHANGELOG[0]?.date ? isoDate(`${CHANGELOG[0].date}T12:00:00Z`) : contentDate('changelog')
      return [
        ...both(b, PATHS.home.fr, PATHS.home.en, d, 'daily', '1.0'),
        ...both(b, '/tarifs', '/en/pricing', d, 'weekly', '0.9'),
        ...both(b, '/fonctionnalites', '/en/features', d, 'weekly', '0.8'),
        ...both(b, '/a-propos', '/en/about', d, 'monthly', '0.6'),
        ...both(b, '/contact', '/en/contact', d, 'monthly', '0.5'),
        ...both(b, '/nouveautes', '/en/changelog', news, 'weekly', '0.6'),
      ]
    },
  },
  aide: {
    title: 'Centre d’aide',
    entries: (b) => {
      const d = contentDate('help')
      return [...both(b, '/aide', '/en/help', d, 'weekly', '0.7'), ...HELP.flatMap((h) => both(b, helpPath(h.slug.fr, 'fr'), helpPath(h.slug.en, 'en'), d, 'monthly', '0.6'))]
    },
  },
  guides: {
    title: 'Guides',
    entries: (b) => {
      const d = contentDate('guides')
      return [...both(b, PATHS.guides.fr, PATHS.guides.en, d, 'weekly', '0.9'), ...GUIDES.flatMap((g) => both(b, guidePath(g.slug.fr, 'fr'), guidePath(g.slug.en, 'en'), d, 'monthly', '0.8'))]
    },
  },
  outils: {
    title: 'Outils gratuits',
    entries: (b) => {
      const d = contentDate('tools')
      return [...both(b, PATHS.tools.fr, PATHS.tools.en, d, 'weekly', '0.9'), ...TOOLS.flatMap((x) => both(b, toolPath(x.slug.fr, 'fr'), toolPath(x.slug.en, 'en'), d, 'monthly', '0.8'))]
    },
  },
  pays: {
    title: 'Vendre par pays',
    entries: (b) => {
      const d = contentDate('countries')
      return [...both(b, PATHS.countries.fr, PATHS.countries.en, d, 'weekly', '0.8'), ...COUNTRIES.flatMap((c) => both(b, countryPath(c.slug, 'fr'), countryPath(c.slug, 'en'), d, 'monthly', '0.7'))]
    },
  },
  villes: {
    title: 'Vendre par ville',
    entries: (b) => {
      const d = contentDate('cities')
      return [...both(b, PATHS.cities.fr, PATHS.cities.en, d, 'weekly', '0.8'), ...CITIES.flatMap((c) => both(b, cityPath(c.slug, 'fr'), cityPath(c.slug, 'en'), d, 'monthly', '0.7'))]
    },
  },
  vendre: {
    title: 'Que vendre',
    entries: (b) => {
      const d = contentDate('niches')
      return [
        ...both(b, PATHS.niches.fr, PATHS.niches.en, d, 'weekly', '0.8'),
        ...NICHES.flatMap((n) => both(b, nichePath(n.slug.fr, 'fr'), nichePath(n.slug.en, 'en'), d, 'monthly', '0.8')),
        ...COMBOS.flatMap((x) => both(b, comboPath(x.niche, x.city, 'fr'), comboPath(x.niche, x.city, 'en'), d, 'monthly', '0.6')),
      ]
    },
  },
  meilleur: {
    title: 'Classements',
    entries: (b) => {
      const d = contentDate('best')
      return [...both(b, PATHS.best.fr, PATHS.best.en, d, 'weekly', '0.9'), ...BEST_PAGES.flatMap((x) => both(b, bestPath(x.slug.fr, 'fr'), bestPath(x.slug.en, 'en'), d, 'monthly', x.country ? '0.8' : '0.9'))]
    },
  },
  alternatives: {
    title: 'Alternatives',
    entries: (b) => {
      const d = contentDate('alternatives')
      return [...both(b, PATHS.alternatives.fr, PATHS.alternatives.en, d, 'weekly', '0.8'), ...ALTERNATIVES.flatMap((a) => both(b, alternativePath(a.slug, 'fr'), alternativePath(a.slug, 'en'), d, 'monthly', '0.7'))]
    },
  },
  comparatifs: {
    title: 'Comparatifs',
    entries: (b) => {
      const d = contentDate('comparisons')
      return [...both(b, PATHS.comparisons.fr, PATHS.comparisons.en, d, 'weekly', '0.7'), ...COMPARISONS.flatMap((c) => both(b, comparisonPath(c.slug, 'fr'), comparisonPath(c.slug, 'en'), d, 'monthly', '0.6'))]
    },
  },
}
