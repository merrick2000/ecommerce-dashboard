/**
 * Formes des réponses de l'API (dates sérialisées en chaînes ISO).
 * Les entrées (payloads) viennent des schémas zod de @zuri/shared.
 */
import type {
  CheckoutSettings,
  Currency,
  FulfillmentStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  ProductContent,
  ProductInput,
  ProductType,
  Promo,
  QuantityOffer,
} from '@zuri/shared'

export type Iso = string

export interface Store {
  id: string
  name: string
  slug: string
  subdomain: string | null
  customDomain: string | null
  customDomainVerifiedAt: Iso | null
  currency: Currency
  locale: 'fr' | 'en'
  country: string
  supportPhone: string | null
  supportEmail: string | null
  hasIntegrationSecret?: boolean
  createdAt: Iso
  updatedAt: Iso
}

export interface CheckoutSettingsResponse {
  settings: CheckoutSettings
  tracking: {
    facebookPixelId: string | null
    facebookTestEventCode: string | null
    tiktokPixelId: string | null
    hasFacebookAccessToken: boolean
  }
}

export interface DisplayPrice {
  currency: string
  regular: number
  effective: number
  promoPercent: number | null
}

export interface ProductListItem {
  id: string
  type: ProductType
  paymentMethod: 'native' | 'integration' | 'cod'
  name: string
  isActive: boolean
  thumbnail: string | null
  stock: number | null
  trackInventory: boolean
  price: DisplayPrice
  createdAt: Iso
  sales: number
  revenue: number
  pending: number
}

export interface ProductVariant {
  id: number
  productId: string
  name: string
  sku: string | null
  price: number | null
  stock: number | null
  isActive: boolean
  position: number
}

export interface Product {
  id: string
  storeId: string
  type: ProductType
  name: string
  isActive: boolean
  description: string
  price: number
  compareAtPrice: number | null
  baseCurrency: string
  currencyPrices: { currency: Currency; price: number }[]
  promo: Promo
  offers: QuantityOffer[]
  coverImage: string | null
  thumbnail: string | null
  content: ProductContent
  /** Suit le schéma partagé (modèle de paiement géré par @zuri/shared). */
  payment: ProductInput['payment']
  delivery: { type: 'file'; filePath: string | null } | { type: 'external_url'; url: string } | null
  externalProductId: string | null
  sku: string | null
  trackInventory: boolean
  stock: number | null
  weightGrams: number | null
  variantLabel: string | null
  variants: ProductVariant[]
  createdAt: Iso
  updatedAt: Iso
}

export type OrderKind = ProductType | 'mixed'

export interface OrderBase {
  id: string
  storeId: string
  orderNumber: string
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  city: string | null
  address: string | null
  deliveryZoneId: number | null
  customerNote: string | null
  kind: OrderKind
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  currency: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentProvider: string | null
  paymentRef: string | null
  paidAt: Iso | null
  fulfillmentStatus: FulfillmentStatus
  confirmedAt: Iso | null
  shippedAt: Iso | null
  deliveredAt: Iso | null
  cancelledAt: Iso | null
  returnedAt: Iso | null
  callAttempts: number
  courier: string | null
  trackingNumber: string | null
  promoCodeId: number | null
  promoCode: string | null
  source: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  createdAt: Iso
  updatedAt: Iso
}

export interface OrderListItem extends OrderBase {
  items: { name: string; variantName: string | null; quantity: number }[]
  customerFlag: boolean
  customerReturns: number
}

export interface OrderList {
  data: OrderListItem[]
  total: number
  page: number
  pageSize: number
  statusCounts: Partial<Record<FulfillmentStatus, number>>
}

export interface OrderItem {
  id: number
  orderId: string
  productId: string | null
  variantId: number | null
  productType: ProductType
  name: string
  variantName: string | null
  quantity: number
  unitPrice: number
  total: number
}

export interface OrderEvent {
  id: number
  orderId: string
  type: string
  message: string | null
  data: Record<string, unknown> | null
  userId: number | null
  userName: string | null
  createdAt: Iso
}

export interface PaymentTransaction {
  id: number
  provider: string
  providerRef: string | null
  status: 'processing' | 'otp_required' | 'redirect' | 'paid' | 'failed'
  network: string | null
  amount: number
  errorMessage: string | null
  createdAt: Iso
}

export interface Customer {
  id: string
  storeId: string
  phone: string
  name: string | null
  email: string | null
  city: string | null
  address: string | null
  ordersCount: number
  deliveredCount: number
  returnedCount: number
  totalSpent: number
  isBlocked: boolean
  notes: string | null
  createdAt: Iso
  updatedAt: Iso
}

export interface DeliveryZone {
  id: number
  storeId: string
  name: string
  country: string
  cities: string[]
  fee: number
  freeAbove: number | null
  codAllowed: boolean
  etaLabel: string | null
  isActive: boolean
  position: number
}

export interface OrderDetail extends OrderBase {
  items: OrderItem[]
  events: OrderEvent[]
  transactions: PaymentTransaction[]
  customer: Customer | null
  zone: DeliveryZone | null
  allowedTransitions: FulfillmentStatus[]
}

export interface CustomerDetail extends Customer {
  orders: {
    id: string
    orderNumber: string
    total: number
    currency: string
    paymentStatus: PaymentStatus
    fulfillmentStatus: FulfillmentStatus
    createdAt: Iso
  }[]
}

export interface PromoCode {
  id: number
  storeId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses: number | null
  usedCount: number
  minSubtotal: number | null
  productIds: string[]
  startsAt: Iso | null
  endsAt: Iso | null
  isActive: boolean
  createdAt: Iso
}

export interface PaymentAccount {
  provider: PaymentProvider
  enabled: boolean
  mode: 'sandbox' | 'live'
  fields: string[]
  sandbox: Record<string, string | null>
  live: Record<string, string | null>
  webhookUrl: string | null
}

export interface KpiBlock {
  orders: number
  revenue: number
  paidOrders: number
  codPending: number
  codToShip: number
  codInTransit: number
  delivered: number
  returned: number
  confirmedOrBeyond: number
  codTotal: number
}

export interface StatsOverview {
  range: { from: Iso; to: Iso }
  currency: string
  current: KpiBlock
  previous: KpiBlock
  rates: { conversion: number | null; confirmation: number | null; delivery: number | null }
  visitors: { visitors: number; views: number; checkouts: number }
  daily: { day: string; orders: number; revenue: number }[]
  topProducts: { productId: string | null; name: string; orders: number; units: number; revenue: number }[]
  sources: { source: string; orders: number; revenue: number }[]
}

export interface UploadedImage {
  key: string
  url: string | null
  size: number
}

export interface UploadedFile {
  key: string
  name: string
  size: number
}

export interface IntegrationsInfo {
  webhookUrl: string
  hasSecret: boolean
}
