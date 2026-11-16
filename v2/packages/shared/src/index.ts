/**
 * Contrat partagé entre l'API (apps/api), le dashboard (apps/dashboard) et,
 * à terme, le storefront. Toute donnée qui traverse le réseau est décrite ici.
 */
import { z } from 'zod'

// ─── Énumérations ────────────────────────────────────────────────────────────

export const CURRENCIES = ['XOF', 'XAF', 'GNF', 'CDF', 'NGN', 'GHS', 'KES', 'MAD', 'EUR', 'USD', 'CAD'] as const
export const currencySchema = z.enum(CURRENCIES)
export type Currency = z.infer<typeof currencySchema>

export const LOCALES = ['fr', 'en'] as const
export const localeSchema = z.enum(LOCALES)

export const STORE_ROLES = ['owner', 'admin', 'staff', 'confirmer'] as const
export const storeRoleSchema = z.enum(STORE_ROLES)
export type StoreRole = z.infer<typeof storeRoleSchema>

export const PRODUCT_TYPES = ['digital', 'physical'] as const
export const productTypeSchema = z.enum(PRODUCT_TYPES)
export type ProductType = z.infer<typeof productTypeSchema>

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES)
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

/**
 * Cycle de vie logistique (produits physiques, surtout paiement à la livraison).
 * Les commandes digitales passent directement à `delivered` une fois payées.
 */
export const FULFILLMENT_STATUSES = [
  'new', // reçue, à appeler
  'confirmed', // client joint, commande validée
  'unreachable', // client injoignable (rappels à faire)
  'shipped', // remise au livreur
  'delivered', // livrée (et encaissée si COD)
  'returned', // refusée / retournée
  'cancelled', // annulée avant expédition
] as const
export const fulfillmentStatusSchema = z.enum(FULFILLMENT_STATUSES)
export type FulfillmentStatus = z.infer<typeof fulfillmentStatusSchema>

/** Transitions autorisées : la machine d'état fait foi côté API et côté UI. */
export const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  new: ['confirmed', 'unreachable', 'cancelled'],
  unreachable: ['confirmed', 'unreachable', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  cancelled: ['new'],
}

export const PAYMENT_METHODS = ['mobile_money', 'cod', 'external', 'manual'] as const
export const paymentMethodSchema = z.enum(PAYMENT_METHODS)
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const PAYMENT_PROVIDERS = ['feexpay', 'fedapay', 'paydunya', 'pawapay', 'chariow', 'maketou'] as const
export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
export type PaymentProvider = z.infer<typeof paymentProviderSchema>

export const TEMPLATES = ['classic', 'dark_premium', 'minimalist_card'] as const
export const templateSchema = z.enum(TEMPLATES)

export const CTA_STYLES = ['default', 'shake', 'pulse', 'glow', 'bounce', 'gradient', 'large'] as const
export const ctaStyleSchema = z.enum(CTA_STYLES)

export const PAGE_BLOCKS = [
  'hero_image',
  'product_name',
  'price_cta',
  'video',
  'custom_text',
  'description',
  'features',
  'trust_badges',
  'guarantee',
  'testimonials',
  'faq',
] as const
export const pageBlockSchema = z.enum(PAGE_BLOCKS)

// ─── Briques réutilisables ───────────────────────────────────────────────────

const money = z.coerce.number().min(0).max(1_000_000_000)
const slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement')
const phone = z.string().trim().min(6).max(25).regex(/^\+?[0-9 ]+$/, 'Numéro invalide')
const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'URL http(s) uniquement')

export const promoSchema = z.object({
  type: z.enum(['none', 'percentage', 'fixed']).default('none'),
  value: money.default(0),
  label: z.string().max(60).optional(),
  display: z.enum(['strikethrough', 'strikethrough_text', 'text_only']).default('strikethrough'),
})
export type Promo = z.infer<typeof promoSchema>

/** Offres par quantité (« 1 pour 10 000, 2 pour 18 000 ») — très utilisées en COD. */
export const quantityOfferSchema = z.object({
  id: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(100),
  price: money,
  label: z.string().max(80).optional(),
  badge: z.string().max(30).optional(),
})
export type QuantityOffer = z.infer<typeof quantityOfferSchema>

export const descriptionCtaSchema = z.object({
  text: z.string().min(1).max(80),
  action: z.enum(['scroll_to_form', 'custom_url']).default('scroll_to_form'),
  url: httpUrl.optional(),
  style: ctaStyleSchema.default('default'),
  alignment: z.enum(['left', 'center', 'full']).default('center'),
  afterParagraph: z.coerce.number().int().min(0).max(200).default(0),
  subText: z.string().max(120).optional(),
})

export const productContentSchema = z.object({
  customText: z.string().max(20_000).optional(),
  features: z.array(z.string().max(200)).max(30).default([]),
  featuresPosition: z.enum(['before_description', 'after_description', 'hidden']).default('after_description'),
  faqs: z.array(z.object({ question: z.string().max(300), answer: z.string().max(3000) })).max(40).default([]),
  testimonials: z
    .array(
      z.object({
        name: z.string().max(80),
        city: z.string().max(80).optional(),
        rating: z.coerce.number().int().min(1).max(5).default(5),
        text: z.string().max(1000),
      }),
    )
    .max(40)
    .default([]),
  testimonialsStyle: z.enum(['cards', 'minimal', 'highlight']).default('cards'),
  video: z
    .object({
      url: httpUrl,
      title: z.string().max(120).optional(),
      position: z.enum(['before_description', 'after_description', 'after_hero']).default('before_description'),
    })
    .nullable()
    .default(null),
  descriptionCtas: z.array(descriptionCtaSchema).max(20).default([]),
  whatsapp: z
    .object({
      enabled: z.boolean().default(false),
      phone: phone.optional(),
      welcomeMessage: z.string().max(300).optional(),
      position: z.enum(['left', 'right']).default('right'),
    })
    .default({ enabled: false, position: 'right' }),
  gallery: z.array(z.string().max(500)).max(12).default([]),
})
export type ProductContent = z.infer<typeof productContentSchema>

export const digitalDeliverySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('file'), filePath: z.string().max(500).nullable().default(null) }),
  z.object({ type: z.literal('external_url'), url: httpUrl }),
])

/**
 * Mode de paiement d'un produit — UN SEUL choix :
 * - `native`      : API de paiement interne (FeexPay, FedaPay, PayDunya, PawaPay),
 *                   possible seulement si la boutique a activé au moins un de ces moyens ;
 * - `integration` : paiement hébergé chez une plateforme (Chariow, Maketou) ou lien externe (Selar, autre) ;
 * - `cod`         : paiement à la livraison (produits physiques uniquement).
 */
export const PAYMENT_CHOICES = ['native', 'integration', 'cod'] as const
export const paymentChoiceSchema = z.enum(PAYMENT_CHOICES)
export type PaymentChoice = z.infer<typeof paymentChoiceSchema>

export const NATIVE_PROVIDERS = ['feexpay', 'fedapay', 'paydunya', 'pawapay'] as const
export const INTEGRATION_PLATFORMS = ['chariow', 'maketou', 'selar', 'link'] as const
export const integrationPlatformSchema = z.enum(INTEGRATION_PLATFORMS)
export type IntegrationPlatform = z.infer<typeof integrationPlatformSchema>

export const productIntegrationSchema = z
  .object({
    platform: integrationPlatformSchema,
    /** Selar / lien : page de paiement externe. */
    url: httpUrl.nullable().default(null),
    /** Chariow / Maketou : identifiant du produit chez la plateforme. */
    productId: z.string().trim().max(100).nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if ((v.platform === 'chariow' || v.platform === 'maketou') && !v.productId) {
      ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Identifiant produit requis pour cette plateforme' })
    }
    if ((v.platform === 'selar' || v.platform === 'link') && !v.url) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'Lien de paiement requis' })
    }
  })

export const productPaymentSchema = z
  .object({
    method: paymentChoiceSchema,
    integration: productIntegrationSchema.nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.method === 'integration' && !v.integration) {
      ctx.addIssue({ code: 'custom', path: ['integration'], message: 'Choisissez une plateforme' })
    }
  })
export type ProductPayment = z.infer<typeof productPaymentSchema>

export const variantInputSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().min(1).max(80),
  sku: z.string().max(60).nullable().optional(),
  price: money.nullable().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
})

export const productInputSchema = z.object({
  type: productTypeSchema,
  name: z.string().trim().min(2).max(160),
  isActive: z.boolean().default(false),
  description: z.string().max(200_000).default(''),
  price: money,
  compareAtPrice: money.nullable().default(null),
  currencyPrices: z.array(z.object({ currency: currencySchema, price: money })).max(11).default([]),
  promo: promoSchema.default({ type: 'none', value: 0, display: 'strikethrough' }),
  offers: z.array(quantityOfferSchema).max(6).default([]),
  coverImage: z.string().max(500).nullable().default(null),
  thumbnail: z.string().max(500).nullable().default(null),
  content: productContentSchema.default(productContentSchema.parse({})),
  /** Absent → défaut selon le type (COD pour le physique, paiement intégré pour le digital). */
  payment: productPaymentSchema.optional(),
  delivery: digitalDeliverySchema.nullable().default(null),
  externalProductId: z.string().max(100).nullable().default(null),
  // physique
  sku: z.string().max(60).nullable().default(null),
  trackInventory: z.boolean().default(false),
  stock: z.coerce.number().int().min(0).nullable().default(null),
  weightGrams: z.coerce.number().int().min(0).nullable().default(null),
  variantLabel: z.string().max(40).nullable().default(null),
  variants: z.array(variantInputSchema).max(50).default([]),
})
  .superRefine((p, ctx) => {
    if (p.type === 'digital' && p.payment?.method === 'cod') {
      ctx.addIssue({ code: 'custom', path: ['payment', 'method'], message: 'Le paiement à la livraison est réservé aux produits physiques' })
    }
  })
  .transform((p) => ({
    ...p,
    payment: p.payment ?? { method: p.type === 'physical' ? ('cod' as const) : ('native' as const), integration: null },
  }))
export type ProductInput = z.infer<typeof productInputSchema>
/** Forme du formulaire côté dashboard (avant valeurs par défaut). */
export type ProductFormInput = z.input<typeof productInputSchema>

// ─── Boutique ────────────────────────────────────────────────────────────────

export const storeCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  currency: currencySchema.default('XOF'),
  locale: localeSchema.default('fr'),
  country: z.string().length(2).toUpperCase().default('BJ'),
})

export const storeUpdateSchema = storeCreateSchema.partial().extend({
  subdomain: slug.nullable().optional(),
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'Domaine invalide')
    .nullable()
    .optional(),
  supportPhone: phone.nullable().optional(),
  supportEmail: z.string().email().nullable().optional(),
})

export const trackingSettingsSchema = z.object({
  facebookPixelId: z.string().regex(/^\d{5,20}$/).nullable().default(null),
  facebookTestEventCode: z.string().max(40).nullable().default(null),
  tiktokPixelId: z.string().max(40).nullable().default(null),
  /** Jamais renvoyé en clair : seul `hasFacebookAccessToken` sort de l'API. */
  facebookAccessToken: z.string().max(500).nullable().optional(),
})

export const checkoutSettingsSchema = z.object({
  template: templateSchema.default('classic'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#f59e0b'),
  ctaText: z.string().max(60).default('Acheter maintenant'),
  ctaStyle: ctaStyleSchema.default('default'),
  trustBadges: z.array(z.string().max(60)).max(8).default([]),
  paymentLogos: z.array(z.string().max(30)).max(16).default([]),
  pageLayout: z
    .array(z.object({ block: pageBlockSchema, visible: z.boolean() }))
    .default(PAGE_BLOCKS.map((block) => ({ block, visible: block !== 'custom_text' }))),
  urgency: z
    .object({
      countdown: z.object({ enabled: z.boolean(), minutes: z.number().int().min(5).max(1440), label: z.string().max(80).optional() }).optional(),
      limitedStock: z.object({ enabled: z.boolean(), remaining: z.number().int().min(1).max(10_000) }).optional(),
      viewers: z.object({ enabled: z.boolean(), base: z.number().int().min(1).max(500) }).optional(),
    })
    .default({}),
  salesPopup: z
    .object({
      enabled: z.boolean().default(false),
      intervalSeconds: z.number().int().min(5).max(600).default(20),
      /** Si vrai, n'affiche que de vraies ventes récentes (prénom + ville). */
      realSalesOnly: z.boolean().default(true),
    })
    .default({ enabled: false, intervalSeconds: 20, realSalesOnly: true }),
  abandonedCart: z
    .object({
      enabled: z.boolean().default(false),
      promoCodeId: z.coerce.number().int().nullable().default(null),
    })
    .default({ enabled: false, promoCodeId: null }),
})
export type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>

// ─── Livraison ───────────────────────────────────────────────────────────────

export const deliveryZoneInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  country: z.string().length(2).toUpperCase(),
  cities: z.array(z.string().trim().min(1).max(80)).max(200).default([]),
  fee: money,
  freeAbove: money.nullable().default(null),
  codAllowed: z.boolean().default(true),
  etaLabel: z.string().max(60).nullable().default(null),
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().default(0),
})
export type DeliveryZoneInput = z.infer<typeof deliveryZoneInputSchema>

// ─── Codes promo ─────────────────────────────────────────────────────────────

export const promoCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/),
  type: z.enum(['percentage', 'fixed']),
  value: money,
  maxUses: z.coerce.number().int().min(1).nullable().default(null),
  minSubtotal: money.nullable().default(null),
  productIds: z.array(z.coerce.number().int()).default([]),
  startsAt: z.coerce.date().nullable().default(null),
  endsAt: z.coerce.date().nullable().default(null),
  isActive: z.boolean().default(true),
})

// ─── Commandes ───────────────────────────────────────────────────────────────

const attributionSchema = z.object({
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  utmContent: z.string().max(255).optional(),
  referrer: z.string().max(2048).optional(),
  sessionId: z.string().max(64).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(200).optional(),
})

/** Commande passée depuis le storefront (public). */
export const publicOrderCreateSchema = z
  .object({
    storeSlug: slug,
    productId: z.coerce.number().int().positive(),
    variantId: z.coerce.number().int().positive().nullable().optional(),
    offerId: z.string().max(40).nullable().optional(),
    quantity: z.coerce.number().int().min(1).max(50).default(1),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().toLowerCase().email().nullable().optional(),
    customerPhone: phone,
    // physique
    city: z.string().trim().max(120).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    deliveryZoneId: z.coerce.number().int().positive().nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    promoCode: z.string().trim().toUpperCase().max(30).nullable().optional(),
    /** Identifiant d'événement partagé pixel ↔ Conversions API (déduplication). */
    eventId: z.string().max(64).optional(),
  })
  .merge(attributionSchema)
export type PublicOrderCreate = z.infer<typeof publicOrderCreateSchema>

export const manualOrderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        variantId: z.coerce.number().int().positive().nullable().optional(),
        quantity: z.coerce.number().int().min(1).max(500),
        unitPrice: money.optional(),
      }),
    )
    .min(1),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: phone,
  customerEmail: z.string().email().nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  deliveryZoneId: z.coerce.number().int().positive().nullable().optional(),
  shippingFee: money.optional(),
  paymentMethod: paymentMethodSchema.default('cod'),
  note: z.string().max(1000).nullable().optional(),
})

export const orderStatusUpdateSchema = z.object({
  fulfillmentStatus: fulfillmentStatusSchema,
  note: z.string().max(1000).optional(),
  courier: z.string().max(80).optional(),
  trackingNumber: z.string().max(80).optional(),
})

export const orderPaymentUpdateSchema = z.object({
  paymentStatus: paymentStatusSchema,
  note: z.string().max(1000).optional(),
})

export const orderNoteSchema = z.object({ note: z.string().trim().min(1).max(2000) })

export const orderListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  type: productTypeSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  fulfillmentStatus: fulfillmentStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, '10 caractères minimum').max(200),
  phone: phone.optional(),
  country: z.string().length(2).toUpperCase().optional(),
})

// ─── Réponses API (formes partagées) ─────────────────────────────────────────

export type ApiError = { error: string; code?: string; issues?: unknown }

export interface Me {
  id: number
  email: string
  name: string
  isPlatformAdmin: boolean
  stores: { id: number; name: string; slug: string; role: StoreRole; currency: Currency }[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
