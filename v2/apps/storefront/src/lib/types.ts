/**
 * Formes des réponses de l'API publique (/api/v1) telles que renvoyées par
 * apps/api/src/routes/public.ts et routes/payments.ts — c'est le code qui fait foi.
 */
import type { CheckoutSettings, Currency, FulfillmentStatus, PaymentMethod, PaymentStatus, ProductContent, ProductType, Promo, QuantityOffer } from '@zuri/shared'

export interface DisplayPrice {
  currency: string
  regular: number
  effective: number
  promoPercent: number | null
}

export interface PublicStore {
  id: number
  name: string
  slug: string
  currency: Currency
  locale: string
  country: string
  supportPhone: string | null
  /** Pas encore exposé par l'API (voir rapport) — gardé optionnel. */
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
  price: DisplayPrice | null
  inStock: boolean
}

export interface CheckoutData {
  store: PublicStore
  product: {
    id: number
    type: ProductType
    name: string
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
  }
  zones: Zone[]
  checkout: CheckoutSettings
  tracking: { facebookPixelId: string | null; tiktokPixelId: string | null }
  onlinePaymentEnabled: boolean
}

export interface CatalogData {
  store: PublicStore
  primaryColor: string
  products: { id: number; type: ProductType; name: string; thumbnail: string | null; price: DisplayPrice }[]
}

export interface PublicOrder {
  orderNumber: string
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
  canDownload: boolean
  createdAt: string
}

export interface CreatedOrder {
  order: { token: string; orderNumber: string; total: number; currency: string; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; eventId: string | null }
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
