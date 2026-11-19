/** Accès aux contenus SEO et construction des adresses (français à la racine, anglais sous /en). */
import { ALTERNATIVES } from './alternatives'
import { COMPARISONS } from './comparisons'
import { COUNTRIES } from './countries'
import { GUIDES } from './guides'
import type { L10n, Lang } from './types'

export { ALTERNATIVES, COMPARISONS, COUNTRIES, GUIDES }
export type * from './types'

export const t = (v: L10n, lang: Lang) => v[lang] || v.fr

/** Chemins des sections, par langue. */
export const PATHS = {
  home: { fr: '/', en: '/en' },
  countries: { fr: '/pays', en: '/en/countries' },
  guides: { fr: '/guides', en: '/en/guides' },
  alternatives: { fr: '/alternatives', en: '/en/alternatives' },
  comparisons: { fr: '/comparatif', en: '/en/compare' },
  tools: { fr: '/outils', en: '/en/tools' },
} as const

export const countryPath = (slug: string, lang: Lang) => `${PATHS.countries[lang]}/${slug}`
export const guidePath = (slug: string, lang: Lang) => `${PATHS.guides[lang]}/${slug}`
export const alternativePath = (slug: string, lang: Lang) => `${PATHS.alternatives[lang]}/${slug}`
export const comparisonPath = (slug: string, lang: Lang) => `${PATHS.comparisons[lang]}/${slug}`

export const findCountry = (slug: string) => COUNTRIES.find((c) => c.slug === slug)
export const findGuide = (slug: string, lang: Lang) => GUIDES.find((g) => g.slug[lang] === slug)
export const findAlternative = (slug: string) => ALTERNATIVES.find((a) => a.slug === slug)
export const findComparison = (slug: string) => COMPARISONS.find((c) => c.slug === slug)

export const REGION_LABEL: Record<string, L10n> = {
  'afrique-ouest': { fr: 'Afrique de l’Ouest', en: 'West Africa' },
  'afrique-centrale': { fr: 'Afrique centrale', en: 'Central Africa' },
  'afrique-est': { fr: 'Afrique de l’Est', en: 'East Africa' },
  'afrique-nord': { fr: 'Afrique du Nord', en: 'North Africa' },
  'afrique-australe': { fr: 'Afrique australe', en: 'Southern Africa' },
  'ocean-indien': { fr: 'Océan Indien', en: 'Indian Ocean' },
  diaspora: { fr: 'Diaspora', en: 'Diaspora' },
}

export const GUIDE_CATEGORY_LABEL: Record<string, L10n> = {
  vendre: { fr: 'Vendre en ligne', en: 'Selling online' },
  publicite: { fr: 'Publicité', en: 'Advertising' },
  cod: { fr: 'Paiement à la livraison', en: 'Cash on delivery' },
  paiement: { fr: 'Paiement', en: 'Payments' },
  saisonnier: { fr: 'Saisons et fêtes', en: 'Seasons and holidays' },
  produit: { fr: 'Produits', en: 'Products' },
}

/** Images générées (scripts hors dépôt) : couverture WebP 1280×720 et partage JPEG 1200×630 par langue. */
export const IMG = {
  country: (slug: string) => `/img/pays/${slug}.webp`,
  guide: (frSlug: string) => `/img/guides/${frSlug}.webp`,
  generic: (key: 'alternatives' | 'comparatif' | 'pays' | 'guides' | 'home' | 'outils') => `/img/generic/${key}.webp`,
}
export const OG = {
  country: (slug: string, lang: Lang) => `/og/${lang}/pays/${slug}.jpg`,
  guide: (frSlug: string, lang: Lang) => `/og/${lang}/guides/${frSlug}.jpg`,
  alternative: (slug: string, lang: Lang) => `/og/${lang}/alternatives/${slug}.jpg`,
  comparison: (slug: string, lang: Lang) => `/og/${lang}/comparatif/${slug}.jpg`,
  hub: (key: 'pays' | 'guides' | 'alternatives' | 'comparatif' | 'outils' | 'home', lang: Lang) => `/og/${lang}/hub/${key}.jpg`,
}
