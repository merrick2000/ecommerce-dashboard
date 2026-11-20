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
  cities: { fr: '/villes', en: '/en/cities' },
  niches: { fr: '/vendre', en: '/en/sell' },
  best: { fr: '/meilleur', en: '/en/best' },
} as const

/**
 * Adresses alignées sur les titres (requêtes) : chaque contenu garde sa clé interne (slug des données,
 * qui sert aussi aux noms d'images), et son adresse publique est calculée ici. Les anciennes adresses
 * (= les clés) redirigent en 301 vers les nouvelles (voir resolveSlug).
 */
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

type Kind = 'countries' | 'cities' | 'guides' | 'alternatives' | 'comparisons' | 'niches' | 'best' | 'tools' | 'combos'

/** Guides et outils : adresses choisies à la main pour coller aux titres. Clé = slug des données. */
const GUIDE_URLS: Record<Lang, Record<string, string>> = {
  fr: {
    'guide-offert-produit-gagnant-pub-facebook': 'guide-offert-produit-gagnant-pub-facebook-afrique',
    'fetes-et-saisons-vente-en-ligne': 'calendrier-ecommerce-afrique-fetes-saisons',
    'astuces-vendre-en-ligne': 'astuces-vendre-en-ligne-afrique',
    'reduire-retours-paiement-livraison': 'reduire-colis-refuses-paiement-livraison',
    'script-confirmation-commande': 'script-confirmation-commande-cod',
    'recruter-gerer-closers': 'recruter-gerer-closers-boutique-cod',
    'trouver-produit-gagnant': 'trouver-produit-gagnant-afrique',
    'page-de-vente-qui-convertit': 'page-de-vente-qui-convertit-cod',
    'integrer-mobile-money-site': 'integrer-mobile-money-site-ecommerce',
  },
  en: {
    'free-guide-winning-product-facebook-ads': 'free-guide-winning-products-facebook-ads-africa',
    'seasonal-selling-calendar': 'seasonal-selling-calendar-ecommerce-africa',
    'tips-to-sell-online': 'tips-to-sell-online-africa',
    'reduce-cod-returns': 'reduce-cash-on-delivery-returns-refusals',
    'order-confirmation-script': 'cod-order-confirmation-script',
    'hire-manage-closers': 'hire-manage-closers-cod-store',
    'find-winning-product': 'find-winning-product-africa',
    'high-converting-sales-page': 'high-converting-sales-page-cash-on-delivery',
    'add-mobile-money-to-website': 'add-mobile-money-payments-website',
    'cod-profit-calculator': 'cod-profit-calculator-real-margin',
  },
}
const TOOL_URLS: Record<Lang, Record<string, string>> = {
  fr: {
    'calculateur-cout-shopify-afrique': 'combien-coute-shopify-calculateur',
    'generateur-message-whatsapp-commande': 'generateur-message-whatsapp-confirmation-commande',
    'calculateur-prix-pack': 'calculateur-prix-pack-2-3-achetes',
  },
  en: {
    'shopify-cost-calculator-africa': 'how-much-does-shopify-cost-calculator',
    'whatsapp-order-message-generator': 'whatsapp-order-confirmation-message-generator',
    'bundle-price-calculator': 'bundle-price-calculator-buy-2-buy-3',
  },
}

let urlCache: Record<Kind, Record<Lang, Map<string, string>>> | null = null
function urlMaps() {
  if (urlCache) return urlCache
  const m = (): Record<Lang, Map<string, string>> => ({ fr: new Map(), en: new Map() })
  const u: Record<Kind, Record<Lang, Map<string, string>>> = { countries: m(), cities: m(), guides: m(), alternatives: m(), comparisons: m(), niches: m(), best: m(), tools: m(), combos: m() }
  for (const c of COUNTRIES) {
    u.countries.fr.set(c.slug, `vendre-en-ligne-${c.slug}`)
    u.countries.en.set(c.slug, `sell-online-${slugify(c.name.en)}`)
  }
  for (const c of _CITIES) {
    u.cities.fr.set(c.slug, `vendre-en-ligne-${c.slug}`)
    u.cities.en.set(c.slug, `sell-online-${c.slug}`)
  }
  for (const lang of ['fr', 'en'] as Lang[]) {
    for (const [k, v] of Object.entries(GUIDE_URLS[lang])) u.guides[lang].set(k, v)
    for (const [k, v] of Object.entries(TOOL_URLS[lang])) u.tools[lang].set(k, v)
  }
  for (const n of _NICHES) {
    u.niches.fr.set(n.slug.fr, `${n.slug.fr.replace(/-en-ligne$/, '')}-en-ligne${/Afrique/.test(n.title.fr) ? '-afrique' : ''}`)
    u.niches.en.set(n.slug.en, `${n.slug.en.replace(/-online$/, '')}-online${/Africa/.test(n.title.en) ? '-africa' : ''}`)
  }
  for (const a of ALTERNATIVES) {
    u.alternatives.fr.set(a.slug, `alternative-${a.slug}${/Afrique/.test(a.title.fr) ? '-afrique' : ''}`)
    u.alternatives.en.set(a.slug, `${a.slug}-alternative${/Africa/.test(a.title.en) ? '-africa' : ''}`)
  }
  for (const c of COMPARISONS) u.comparisons.fr.set(c.slug, c.slug.replace('-vs-', '-ou-'))
  // Combinaisons métier × ville : /vendre/<base-métier>-<ville>, /en/sell/<niche-base>-<city>.
  for (const x of _COMBOS) {
    const meta = COMBO_NICHES[x.niche]
    if (!meta) continue
    const key = comboKey(x.niche, x.city)
    u.combos.fr.set(key, `${meta.base.fr}-${x.city}`)
    u.combos.en.set(key, `${meta.base.en}-${x.city}`)
  }
  urlCache = u
  return u
}

/** Adresse publique d'un contenu à partir de sa clé. */
export const urlSlug = (kind: Kind, key: string, lang: Lang) => urlMaps()[kind][lang].get(key) ?? key

/** Adresse demandée → clé du contenu. `legacy` : ancienne adresse, à rediriger en 301. */
export function resolveSlug(kind: Kind, param: string, lang: Lang): { key: string; legacy: boolean } {
  const map = urlMaps()[kind][lang]
  for (const [k, v] of map) if (v === param) return { key: k, legacy: false }
  return { key: param, legacy: map.has(param) }
}

export const countryPath = (slug: string, lang: Lang) => `${PATHS.countries[lang]}/${urlSlug('countries', slug, lang)}`
export const guidePath = (slug: string, lang: Lang) => `${PATHS.guides[lang]}/${urlSlug('guides', slug, lang)}`
export const alternativePath = (slug: string, lang: Lang) => `${PATHS.alternatives[lang]}/${urlSlug('alternatives', slug, lang)}`
export const cityPath = (slug: string, lang: Lang) => `${PATHS.cities[lang]}/${urlSlug('cities', slug, lang)}`
export const nichePath = (slug: string, lang: Lang) => `${PATHS.niches[lang]}/${urlSlug('niches', slug, lang)}`
export const bestPath = (slug: string, lang: Lang) => `${PATHS.best[lang]}/${urlSlug('best', slug, lang)}`
export const comparisonPath = (slug: string, lang: Lang) => `${PATHS.comparisons[lang]}/${urlSlug('comparisons', slug, lang)}`
export const toolPath = (slug: string, lang: Lang) => `${PATHS.tools[lang]}/${urlSlug('tools', slug, lang)}`
/** Page « vendre [métier] à [ville] » : clé fr du métier + slug de la ville (sous /vendre et /en/sell). */
export const comboPath = (nicheKeyFr: string, citySlug: string, lang: Lang) => `${PATHS.niches[lang]}/${urlSlug('combos', comboKey(nicheKeyFr, citySlug), lang)}`

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
  hub: (key: 'pays' | 'guides' | 'alternatives' | 'comparatif' | 'outils' | 'home' | 'villes' | 'vendre', lang: Lang) => `/og/${lang}/hub/${key}.jpg`,
  city: (slug: string, lang: Lang) => `/og/${lang}/villes/${slug}.jpg`,
  niche: (frSlug: string, lang: Lang) => `/og/${lang}/vendre/${frSlug}.jpg`,
}

export { NICHES } from './niches'
export { CITIES } from './cities'
import { NICHES as _NICHES } from './niches'
import { CITIES as _CITIES } from './cities'
export const findNiche = (slug: string, lang: Lang) => _NICHES.find((n) => n.slug[lang] === slug)

export { BEST_PAGES } from './best'
import { BEST_PAGES as _BEST } from './best'
export const findBest = (slug: string, lang: Lang) => _BEST.find((b) => b.slug[lang] === slug)

export { COMBOS, COMBO_NICHES, COMBO_MONEY, COUNTRY_DELIVERY, comboKey, findCombo } from './combos'
export type { ComboPage, ComboNicheMeta, ComboMoney } from './combos'
import { COMBOS as _COMBOS, COMBO_NICHES, comboKey } from './combos'
