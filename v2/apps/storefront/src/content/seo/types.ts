/**
 * Contenus SEO du site Zuri (pages pays, guides, alternatives, comparatifs), en français et en anglais.
 *
 * Règles de rédaction (impératives) :
 * - Aucun tiret long « — » ni tiret moyen « – » (ni en texte, ni en titre). Aucun emoji.
 * - Français : tutoiement, mots du terrain. Anglais : « you », simple et direct.
 * - Aucune statistique inventée : chaque chiffre a une source dans `sources`.
 * - Rien de négatif sur un concurrent qui ne soit pas sourcé ; ton factuel et respectueux.
 * - Pas de HTML : du texte brut. Les listes sont des tableaux de chaînes.
 */

export type Lang = 'fr' | 'en'

/** Texte bilingue. */
export interface L10n {
  fr: string
  en: string
}

export interface Source {
  label: string
  url: string
}

/** Bloc de contenu générique (guides, alternatives, comparatifs). */
export type Block =
  | { type: 'p'; text: L10n }
  | { type: 'h2'; text: L10n }
  | { type: 'h3'; text: L10n }
  | { type: 'list'; ordered?: boolean; items: L10n[] }
  /** Encadré conseil / attention. */
  | { type: 'tip'; title: L10n; text: L10n }
  /** Tableau simple : première ligne = en-têtes. */
  | { type: 'table'; rows: L10n[][] }
  /** Appel à l'action vers l'inscription (texte du bouton facultatif). */
  | { type: 'cta'; title: L10n; text: L10n }
  /** Illustration animée ou élément interactif (voir components/marketing/widgets). */
  | { type: 'widget'; id: WidgetId }
  /** Liste à cocher interactive (progression enregistrée dans le navigateur). */
  | { type: 'checklist'; items: L10n[] }
  /** Vidéo YouTube recommandée, par langue (affichée seulement si la langue a une vidéo). */
  | { type: 'video'; videos: { fr?: VideoRef; en?: VideoRef } }

export interface VideoRef {
  id: string
  title: string
  channel: string
}

export type WidgetId =
  | 'cod-funnel'
  | 'bf-timeline'
  | 'delivery-journey'
  | 'whatsapp-chat'
  | 'ad-budget'
  | 'hook-3s'
  | 'pixel-flow'
  | 'momo-payment'
  | 'speed-race'
  | 'page-anatomy'
  | 'product-score'
  | 'season-calendar'
  | 'closer-pay'
  | 'dropship-flow'
  | 'margin-bars'
  | 'bundle-compare'
  | 'call-sim'

export interface Faq {
  q: L10n
  a: L10n
}

export interface CountryPage {
  /** Identifiant d'URL, identique dans les deux langues (ex. « cote-d-ivoire », « nigeria »). */
  slug: string
  /** Code ISO 3166-1 alpha-2. */
  iso: string
  name: L10n
  /** Préposition française correcte : « en Côte d’Ivoire », « au Sénégal », « aux Comores ». */
  inName: string
  region: 'afrique-ouest' | 'afrique-centrale' | 'afrique-est' | 'afrique-nord' | 'afrique-australe' | 'ocean-indien' | 'diaspora'
  /** Langue principale du marché (détermine la langue prioritaire, mais les deux versions existent). */
  primaryLang: Lang
  currency: { code: string; label: L10n }
  /** Grandes villes (3 à 6). */
  cities: string[]
  /** Moyens de Mobile Money courants (opérateurs). */
  mobileMoney: string[]
  /** Prestataires intégrés à Zuri disponibles dans ce pays (vérifiés) : FeexPay, FedaPay, PayDunya, PawaPay. */
  zuriPsps: string[]
  /** Méta-titre et méta-description (≤ 60 et ≤ 155 caractères environ). */
  title: L10n
  description: L10n
  /** Accroche H1 et chapeau. */
  h1: L10n
  intro: L10n
  /** Réalité du e-commerce local : 3 à 5 paragraphes factuels (paiement, livraison, habitudes, réseaux sociaux). */
  market: L10n[]
  /** Conseils concrets pour vendre dans ce pays (5 à 8). */
  tips: L10n[]
  /** Idées de produits qui se vendent bien en ligne localement (5 à 8), formulées prudemment. */
  productIdeas: L10n[]
  faqs: Faq[]
  sources: Source[]
}

export interface GuidePage {
  slug: L10n
  category: 'vendre' | 'publicite' | 'cod' | 'paiement' | 'saisonnier' | 'produit'
  title: L10n
  description: L10n
  h1: L10n
  intro: L10n
  /** Temps de lecture en minutes. */
  readingMinutes: number
  blocks: Block[]
  faqs: Faq[]
  sources: Source[]
  /** Slugs (fr) d'autres guides liés. */
  related: string[]
}

export interface AlternativePage {
  /** Identifiant d'URL (ex. « shopify »). */
  slug: string
  competitor: string
  competitorUrl: string
  title: L10n
  description: L10n
  h1: L10n
  intro: L10n
  /** Ce que fait bien le concurrent (honnête). */
  strengths: L10n[]
  /** Limites pour un vendeur africain COD / Mobile Money (sourcées ou factuelles). */
  limits: L10n[]
  /** Tableau comparatif : [critère, concurrent, Zuri]. */
  compare: [L10n, L10n, L10n][]
  /** Pour qui le concurrent reste un bon choix (honnêteté). */
  stillGoodFor: L10n
  /** Comment migrer vers Zuri. */
  migration: L10n[]
  faqs: Faq[]
  sources: Source[]
}

export interface ComparisonPage {
  /** Ex. « shopify-vs-woocommerce ». */
  slug: string
  a: string
  b: string
  title: L10n
  description: L10n
  h1: L10n
  intro: L10n
  /** Tableau : [critère, A, B]. */
  compare: [L10n, L10n, L10n][]
  blocks: Block[]
  /** Verdict nuancé, puis mention de Zuri pour un vendeur africain COD. */
  verdict: L10n
  faqs: Faq[]
  sources: Source[]
}
