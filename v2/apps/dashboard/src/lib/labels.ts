import { ROLE_LABELS, type FulfillmentStatus, type PaymentMethod, type PaymentProvider, type PaymentStatus, type StoreRole } from '@zuri/shared'

export type Tone = 'neutral' | 'amber' | 'blue' | 'green' | 'red' | 'violet' | 'orange'

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  unreachable: 'Injoignable',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  returned: 'Retournée',
  cancelled: 'Annulée',
}

export const FULFILLMENT_TONE: Record<FulfillmentStatus, Tone> = {
  new: 'amber',
  confirmed: 'blue',
  unreachable: 'orange',
  shipped: 'violet',
  delivered: 'green',
  returned: 'red',
  cancelled: 'neutral',
}

/** Libellé du bouton d'action qui mène à ce statut. */
export const TRANSITION_ACTION: Record<FulfillmentStatus, string> = {
  new: 'Remettre en attente',
  confirmed: 'Confirmer',
  unreachable: 'Injoignable',
  shipped: 'Expédier',
  delivered: 'Livrée',
  returned: 'Retour',
  cancelled: 'Annuler',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  failed: 'Échouée',
  refunded: 'Remboursée',
}

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  pending: 'neutral',
  paid: 'green',
  failed: 'red',
  refunded: 'violet',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'Paiement à la livraison',
  mobile_money: 'Mobile money',
  external: 'Lien externe',
  manual: 'Manuel',
}

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  feexpay: 'FeexPay',
  fedapay: 'FedaPay',
  paydunya: 'PayDunya',
  pawapay: 'pawaPay',
  chariow: 'Chariow',
  maketou: 'Maketou',
}

export const FIELD_LABEL: Record<string, string> = {
  apiKey: 'Clé API',
  shopId: 'ID boutique',
  webhookSecret: 'Secret webhook',
  masterKey: 'Master key',
  publicKey: 'Clé publique',
  privateKey: 'Clé privée',
  token: 'Token',
}

/** Libellés des rôles : source unique dans @zuri/shared. */
export const ROLE_LABEL: Record<StoreRole, string> = ROLE_LABELS

export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'CI', name: 'Côte d’Ivoire' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'TG', name: 'Togo' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'RD Congo' },
  { code: 'TD', name: 'Tchad' },
  { code: 'CF', name: 'Centrafrique' },
  { code: 'MA', name: 'Maroc' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CA', name: 'Canada' },
]

export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code

export const CURRENCY_NAME: Record<string, string> = {
  XOF: 'Franc CFA (UEMOA)',
  XAF: 'Franc CFA (CEMAC)',
  GNF: 'Franc guinéen',
  CDF: 'Franc congolais',
  NGN: 'Naira',
  GHS: 'Cedi',
  KES: 'Shilling kényan',
  MAD: 'Dirham',
  EUR: 'Euro',
  USD: 'Dollar US',
  CAD: 'Dollar canadien',
}

export const PAGE_BLOCK_LABEL: Record<string, string> = {
  hero_image: 'Image principale',
  product_name: 'Nom du produit',
  price_cta: 'Prix et bouton',
  video: 'Vidéo',
  custom_text: 'Texte personnalisé',
  description: 'Description',
  features: 'Points forts',
  trust_badges: 'Badges de confiance',
  guarantee: 'Garantie',
  testimonials: 'Témoignages',
  faq: 'FAQ',
}

export const CTA_STYLE_LABEL: Record<string, string> = {
  default: 'Standard',
  shake: 'Secousse',
  pulse: 'Pulsation',
  glow: 'Lueur',
  bounce: 'Rebond',
  gradient: 'Dégradé',
  large: 'Grand',
}

export const TEMPLATE_LABEL: Record<string, string> = {
  classic: 'Classique',
  dark_premium: 'Sombre premium',
  minimalist_card: 'Carte minimaliste',
}
