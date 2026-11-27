/**
 * Formes des réponses de l'API (dates sérialisées en chaînes ISO).
 * Les entrées (payloads) viennent des schémas zod de @zuri/shared.
 */
import type {
  PoSettings,
  Bundle,
  Funnel,
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
  kind: ProductType
  status: 'active' | 'paused' | 'closed'
  pauseMessage: string | null
  pausedAt: Iso | null
  closedAt: Iso | null
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
    codPurchaseOn: 'created' | 'confirmed' | 'delivered'
    capiLog?: { at: string; event: string; ref: string | null; ok: boolean; status: number | null; eventsReceived: number | null; fbtraceId: string | null; error: string | null; test: boolean }[]
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
  category: string | null
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
  costPrice: number | null
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
  costPrice: number | null
  bundle?: Bundle | null
  funnel?: Funnel | null
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
  category: string | null
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
  /** customFields : réponses aux champs personnalisés du formulaire de commande. */
  metadata?: { customFields?: { key: string; label: string; value: string }[]; flagged?: string } | null
  kind: OrderKind
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  /** Payment Orchestrator : session, transaction, état, prestataire et opérateur utilisés, raison d'échec. */
  poSessionId?: string | null
  poTransactionId?: string | null
  poStatus?: string | null
  poLivemode?: boolean | null
  poProvider?: string | null
  poOperator?: string | null
  poCountry?: string | null
  poFailure?: string | null
  /** Coûts réels (bénéfice) : livreur et retour. */
  deliveryCost?: number | null
  returnCost?: number | null
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
  /** Membre de l'équipe qui traite la commande (null = libre). */
  assignedTo: number | null
  assignedAt: Iso | null
  assigneeName: string | null
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
  /** Prix d'achat unitaire figé à la commande (null : inconnu ou masqué). */
  unitCost?: number | null
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
  courierCost: number | null
  returnCost: number | null
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
  /** Payment Orchestrator : réglages du widget (null pour les autres moyens). */
  settings?: PoSettings | null
}

export interface KpiBlock {
  orders: number
  /** null quand le membre n'a pas le droit de voir le chiffre d'affaires. */
  revenue: number | null
  paidOrders: number
  codPending: number
  codToShip: number
  codInTransit: number | null
  delivered: number
  returned: number
  confirmedOrBeyond: number
  codTotal: number
}

export interface ProfitTotals {
  revenueCollected: number
  ordersCollected: number
  productCost: number
  deliveryCost: number
  returnCost: number
  grossProfit: number
  expenses: number
  netProfit: number
  netMargin: number | null
  profitPerOrder: number | null
  unitsWithoutCost: number
  ordersWithoutDeliveryCost: number
}

export interface StatsOverview {
  range: { from: Iso; to: Iso }
  currency: string
  current: KpiBlock
  previous: KpiBlock
  rates: { conversion: number | null; confirmation: number | null; delivery: number | null }
  visitors: { visitors: number; views: number; checkouts: number }
  daily: { day: string; orders: number; revenue: number | null }[]
  topProducts: { productId: string | null; name: string; orders: number; units: number; revenue: number | null }[]
  sources: { source: string; orders: number; revenue: number | null }[]
  /** Faux : les montants de revenu valent null et ne doivent pas être affichés. */
  revenueVisible: boolean
  /** Bénéfice réel (null sans l'option « voir le chiffre d'affaires »). */
  profit: { current: ProfitTotals; previous: ProfitTotals } | null
  /** Résultats personnels (commandes attribuées au membre connecté). */
  mine: { assigned: number; confirmed: number; delivered: number; confirmationRate: number | null } | null
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
