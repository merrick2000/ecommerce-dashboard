/**
 * Formes des réponses de l'API publique (/api/v1) telles que renvoyées par
 * apps/api/src/routes/public.ts et routes/payments.ts, c'est le code qui fait foi.
 */
import type { CheckoutSettings, OrderForm, Currency, FulfillmentStatus, PaymentMethod, PaymentStatus, ProductContent, ProductType, Promo, QuantityOffer } from '@zuri/shared'

export interface DisplayPrice {
  currency: string
  regular: number
  effective: number
  promoPercent: number | null
}

export interface PublicStore {
  /** active | paused (commandes fermées) */
  status?: 'active' | 'paused' | 'closed'
  pauseMessage?: string | null
  id: string
  name: string
  slug: string
  currency: Currency
  locale: string
  country: string
  supportPhone: string | null
  /** Pas encore exposé par l'API (voir rapport), gardé optionnel. */
  supportEmail?: string | null
}

export interface Zone {
  id: number
  name: string
  country: string
  cities: string[]
  fee: number
  freeAbove: number | null
  codAllowed: boolean
  etaLabel: string | null
}

export interface Variant {
  id: number
  name: string
  sku?: string
  price: DisplayPrice | null
  inStock: boolean
}

/** Offre du tunnel telle qu'exposée par l'API (prix fixé par le vendeur). */
export interface PublicOffer {
  id: string
  title: string
  text: string
  price: number
  regularPrice: number | null
  productName: string
  image: string | null
  acceptLabel: string | null
  declineLabel: string | null
}
export interface PublicFunnel {
  bump: PublicOffer | null
  upsells: (PublicOffer & { downsell: PublicOffer | null })[]
  thankYou: { buttonLabel: string; buttonUrl: string } | null
}

export type PaymentGateway = { kind: 'orchestrator'; widgetMode: 'auto' | 'modal' | 'redirect'; locale: 'fr' | 'en' | null; widgetUrl: string; test: boolean } | { kind: 'direct' }

export interface CheckoutData {
  store: PublicStore
  product: {
    id: string
    type: ProductType
    name: string
    sku?: string
    updatedAt?: string
    description: string
    coverImage: string | null
    thumbnail: string | null
    price: DisplayPrice
    promo: Promo
    compareAtPrice: number | null
    offers: QuantityOffer[]
    content: ProductContent
    payment: { method: 'native' | 'integration' | 'cod'; externalUrl: string | null; platform: string | null }
    variantLabel: string | null
    variants: Variant[]
    inStock: boolean
    /** Pack : produits inclus. */
    bundle: { productId: string; name: string; quantity: number; image: string | null; price: number }[] | null
  }
  /** Tunnel de vente (order bump, upsells, remerciement). */
  funnel: PublicFunnel | null
  /** Paiement en ligne : Payment Orchestrator (widget) ou direct (réseau par réseau). */
  paymentGateway?: PaymentGateway
  zones: Zone[]
  checkout: CheckoutSettings
  orderForm: OrderForm
  tracking: { facebookPixelId: string | null; tiktokPixelId: string | null }
  onlinePaymentEnabled: boolean
}

export interface CatalogData {
  store: PublicStore
  primaryColor: string
  cartEnabled?: boolean
  products: { id: string; type: ProductType; name: string; category?: string | null; hasVariants?: boolean; paymentMethod?: 'cod' | 'native' | 'integration'; thumbnail: string | null; price: DisplayPrice }[]
}

export interface PublicOrder {
  orderNumber: string
  paymentGateway?: PaymentGateway
  store: PublicStore | null
  customerName: string
  items: { name: string; variantName: string | null; quantity: number; total: number; productType: ProductType }[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  currency: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  eventId: string | null
  pixelEvent?: 'Purchase' | 'Lead'
  canDownload: boolean
  createdAt: string
}

export interface CreatedOrder {
  order: { token: string; orderNumber: string; total: number; currency: string; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; eventId: string | null; pixelEvent?: 'Purchase' | 'Lead' }
  promoError: string | null
}

export type PaymentResponse =
  | { status: 'processing'; message: string }
  | { status: 'redirect'; redirectUrl: string }
  | { status: 'otp_required'; ussdInstruction?: string }
  | { status: 'paid' }

export interface ApiErrorBody {
  error: string
  code?: string
  issues?: { path: string; message: string }[]
}

/** Catalogue normalisé d'une boutique (flux Google Merchant / Meta, format Shopify). */
export interface CatalogVariant {
  id: string
  sku: string
  title: string
  price: number
  salePrice: number | null
  availability: 'in_stock' | 'out_of_stock'
  inventory: number | null
}
export interface CatalogItem {
  id: string
  sku: string
  title: string
  description: string
  descriptionHtml: string
  path: string
  images: string[]
  type: ProductType
  category: string | null
  brand: string
  condition: 'new'
  currency: string
  price: number
  salePrice: number | null
  availability: 'in_stock' | 'out_of_stock'
  inventory: number | null
  weightGrams: number | null
  variantLabel: string | null
  variants: CatalogVariant[]
  shipping: { country: string; price: number }[]
  rating: { value: number; count: number } | null
  createdAt: string
  updatedAt: string
}
export interface StoreCatalog {
  store: PublicStore
  items: CatalogItem[]
}
