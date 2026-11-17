/**
 * Contrat partagé entre l'API (apps/api), le dashboard (apps/dashboard) et,
 * à terme, le storefront. Toute donnée qui traverse le réseau est décrite ici.
 */
import { z } from 'zod'
import { CUSTOM_FIELD_TYPES, DEFAULT_FORM_FIELDS, DEFAULT_FORM_TEXTS, DEFAULT_ORDER_FORM, type OrderForm } from './form-runtime'

export * from './form-runtime'

// ─── Énumérations ────────────────────────────────────────────────────────────

export const CURRENCIES = ['XOF', 'XAF', 'GNF', 'CDF', 'NGN', 'GHS', 'KES', 'MAD', 'EUR', 'USD', 'CAD'] as const
export const currencySchema = z.enum(CURRENCIES)
export type Currency = z.infer<typeof currencySchema>

/** Fuseau par défaut selon le pays (les stats « par jour » suivent l'heure locale de la boutique). */
export const COUNTRY_TIMEZONES: Record<string, string> = {
  BJ: 'Africa/Porto-Novo', TG: 'Africa/Lome', CI: 'Africa/Abidjan', SN: 'Africa/Dakar', BF: 'Africa/Ouagadougou', ML: 'Africa/Bamako',
  NE: 'Africa/Niamey', GN: 'Africa/Conakry', CM: 'Africa/Douala', GA: 'Africa/Libreville', CG: 'Africa/Brazzaville', CD: 'Africa/Kinshasa',
  NG: 'Africa/Lagos', GH: 'Africa/Accra', KE: 'Africa/Nairobi', RW: 'Africa/Kigali', TZ: 'Africa/Dar_es_Salaam', UG: 'Africa/Kampala',
  MA: 'Africa/Casablanca', FR: 'Europe/Paris', BE: 'Europe/Brussels', CA: 'America/Toronto', US: 'America/New_York',
}
export const timezoneForCountry = (country: string) => COUNTRY_TIMEZONES[country.toUpperCase()] ?? 'Africa/Lagos'
export const timezoneSchema = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}, 'Fuseau horaire invalide')

export const LOCALES = ['fr', 'en'] as const
export const localeSchema = z.enum(LOCALES)

// ─── Équipe : rôles, permissions, périmètre produits ─────────────────────────

export const STORE_ROLES = ['owner', 'admin', 'store_manager', 'order_manager', 'closer'] as const
export const storeRoleSchema = z.enum(STORE_ROLES)
export type StoreRole = z.infer<typeof storeRoleSchema>

export const ROLE_LABELS: Record<StoreRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  store_manager: 'Gestionnaire boutique',
  order_manager: 'Gestionnaire commandes',
  closer: 'Closer',
}

export const ROLE_DESCRIPTIONS: Record<StoreRole, string> = {
  owner: 'Accès total, y compris les moyens de paiement et l’équipe.',
  admin: 'Tout gérer sauf les moyens de paiement et les intégrations.',
  store_manager: 'Produits, promos, zones de livraison. Voit les commandes.',
  order_manager: 'Toutes les commandes : appels, statuts, livraisons, attribution aux closers.',
  closer: 'Appelle et confirme les commandes des produits auxquels il a accès.',
}

export const PERMISSIONS = [
  'orders.view',
  'orders.update',
  'orders.create',
  'orders.assign',
  'orders.payment',
  'orders.export',
  'customers.view',
  'customers.edit',
  'products.view',
  'products.edit',
  'marketing.edit',
  'delivery.edit',
  'store.settings',
  'team.manage',
  'payments.manage',
  'integrations.manage',
  'stats.view',
  'stats.revenue',
  'activity.view',
] as const
export type Permission = (typeof PERMISSIONS)[number]

const ALL_PERMISSIONS = [...PERMISSIONS]
export const ROLE_PERMISSIONS: Record<StoreRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((p) => p !== 'payments.manage' && p !== 'integrations.manage'),
  store_manager: ['products.view', 'products.edit', 'marketing.edit', 'delivery.edit', 'orders.view', 'customers.view', 'stats.view', 'activity.view'],
  order_manager: ['orders.view', 'orders.update', 'orders.create', 'orders.assign', 'customers.view', 'customers.edit', 'products.view', 'stats.view', 'activity.view'],
  closer: ['orders.view', 'orders.update', 'customers.view', 'products.view', 'stats.view'],
}

/** Options cochables par membre, en plus de son rôle. */
export const memberOptionsSchema = z.object({
  /** Voir le chiffre d'affaires et les montants encaissés dans les statistiques. */
  viewRevenue: z.boolean().default(false),
  /** Exporter les commandes en CSV. */
  exportData: z.boolean().default(false),
})
export type MemberOptions = z.infer<typeof memberOptionsSchema>

/** Rôles qui voient toujours toute la boutique (pas de périmètre produits). */
export const FULL_SCOPE_ROLES: readonly StoreRole[] = ['owner', 'admin']

export function permissionsFor(role: StoreRole, options: Partial<MemberOptions> = {}): Permission[] {
  const set = new Set<Permission>(ROLE_PERMISSIONS[role])
  if (options.viewRevenue) set.add('stats.revenue')
  if (options.exportData && set.has('orders.view')) set.add('orders.export')
  return [...set]
}

/** Peut-on attribuer ce rôle ? Seul le propriétaire nomme des admins ; personne ne nomme de propriétaire ici. */
export function canGrantRole(actor: StoreRole, target: StoreRole): boolean {
  if (target === 'owner') return false
  if (target === 'admin') return actor === 'owner'
  return actor === 'owner' || actor === 'admin'
}

const memberAccessFields = {
  role: storeRoleSchema.exclude(['owner']),
  /** null = tous les produits de la boutique ; sinon la liste des produits accessibles. */
  productIds: z.array(z.string().max(40)).max(500).nullable().default(null),
  options: memberOptionsSchema.default({ viewRevenue: false, exportData: false }),
}

export const invitationCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide'),
  ...memberAccessFields,
})
export type InvitationCreate = z.infer<typeof invitationCreateSchema>

export const memberUpdateSchema = z.object(memberAccessFields)
export type MemberUpdate = z.infer<typeof memberUpdateSchema>

export const inviteRegisterSchema = z.object({
  token: z.string().min(20).max(200),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(10, '10 caractères minimum').max(200),
})

export const orderAssignSchema = z.object({ userId: z.number().int().positive().nullable() })

export interface TeamMember {
  userId: number
  name: string
  email: string
  avatarUrl: string | null
  role: StoreRole
  productIds: string[] | null
  options: MemberOptions
  lastLoginAt: string | null
  joinedAt: string
  /** Commandes en cours attribuées (nouvelles, injoignables, confirmées). */
  openOrders: number
}

export interface TeamInvitation {
  id: string
  email: string
  role: StoreRole
  productIds: string[] | null
  options: MemberOptions
  invitedBy: string | null
  expiresAt: string
  createdAt: string
}

export interface InvitationPreview {
  storeId: string
  storeName: string
  inviterName: string | null
  email: string
  role: StoreRole
  expired: boolean
  accepted: boolean
  /** Un compte existe déjà pour cet email (se connecter plutôt que s'inscrire). */
  hasAccount: boolean
}

export interface ActivityItem {
  id: string
  at: string
  actor: { id: number; name: string } | null
  /** order | product | promo | zone | store | team | payment_account */
  entityType: string
  entityId: string | null
  /** Libellé lisible de l'objet (n° de commande, nom de produit…). */
  entityLabel: string | null
  action: string
  message: string
}

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

// ─── Identifiants publics ────────────────────────────────────────────────────

/**
 * Identifiants non séquentiels « à la Stripe » : préfixe + 16 caractères base62 aléatoires (~95 bits).
 * Ils apparaissent dans les URLs : impossibles à deviner, ne révèlent aucun volume.
 */
export const ID_PREFIXES = { store: 'shp', product: 'prd', order: 'ord', customer: 'cus', invitation: 'inv' } as const
const publicId = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[0-9A-Za-z]{8,32}$`), 'Identifiant invalide')
export const storeIdSchema = publicId(ID_PREFIXES.store)
export const productIdSchema = publicId(ID_PREFIXES.product)
export const orderIdSchema = publicId(ID_PREFIXES.order)
export const customerIdSchema = publicId(ID_PREFIXES.customer)
export const invitationIdSchema = publicId(ID_PREFIXES.invitation)

// ─── Briques réutilisables ───────────────────────────────────────────────────

const money = z.coerce.number().min(0).max(1_000_000_000)
/** Sous-domaines réservés à la plateforme (app.zurisell.store = dashboard…). */
export const RESERVED_SLUGS = ['app', 'www', 'api', 'admin', 'dashboard', 'mail', 'email', 'static', 'cdn', 'assets', 'help', 'support', 'blog', 'docs', 'status', 'shop', 'store', 'zuri', 'login', 'auth']
const slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement')
  .refine((s) => !RESERVED_SLUGS.includes(s), 'Ce nom est réservé, choisissez-en un autre')
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

/** Offres par quantité (« 1 pour 10 000, 2 pour 18 000 »), très utilisées en COD. */
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

// ─── Formulaire de commande paramétrable ─────────────────────────────────────

const formText = (max: number) => z.string().max(max).default('')

export const orderFormFieldSchema = z
  .object({
    key: z.string().regex(/^(variant|quantity|name|phone|email|city|address|note|cf_[a-z0-9]{3,20})$/, 'Clé de champ invalide'),
    builtin: z.boolean(),
    type: z.enum(CUSTOM_FIELD_TYPES).nullable().default(null),
    visible: z.boolean().default(true),
    required: z.boolean().default(false),
    label: formText(80),
    placeholder: formText(120),
    help: formText(200),
    width: z.enum(['full', 'half']).default('full'),
    options: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  })
  .refine((f) => f.builtin === !f.key.startsWith('cf_'), 'Champ intégré ou personnalisé incohérent')
  .refine((f) => f.builtin || f.type !== null, 'Type requis pour un champ personnalisé')
  .refine((f) => !(f.type === 'select' || f.type === 'radio') || f.options.length > 0, 'Ajoutez au moins une option')

export const orderFormSchema = z.object({
  fields: z.array(orderFormFieldSchema).max(40).default(DEFAULT_FORM_FIELDS),
  texts: z
    .object({
      title: formText(120),
      subtitle: formText(300),
      submitCod: formText(80),
      submitOnline: formText(80),
      successTitle: formText(120),
      successMessage: formText(500),
      reassurance: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
      footnote: formText(300),
    })
    .default(DEFAULT_FORM_TEXTS),
  showPromo: z.boolean().default(true),
})

/** Lecture tolérante d'une configuration stockée (ancienne, absente ou abîmée → formulaire par défaut). */
export function parseOrderForm(raw: unknown): OrderForm {
  const r = orderFormSchema.safeParse(raw ?? {})
  return r.success ? (r.data as OrderForm) : DEFAULT_ORDER_FORM
}

export const productContentSchema = z.object({
  customText: z.string().max(20_000).optional(),
  /** Petit texte au-dessus du titre (ex. « Complément alimentaire · Hommes dès 40 ans »). */
  kicker: z.string().max(80).optional(),
  /** Grand titre accrocheur affiché à la place du nom du produit (le nom reste dans l'accroche). */
  headline: z.string().max(160).optional(),
  /** Phrase courte sous le titre (ex. « Retrouvez des nuits calmes, naturellement. »). */
  tagline: z.string().max(300).optional(),
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
  /** Formulaire propre à ce produit ; null = formulaire de la boutique. */
  orderForm: orderFormSchema.nullable().default(null),
})
export type ProductContent = z.infer<typeof productContentSchema>

export const digitalDeliverySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('file'), filePath: z.string().max(500).nullable().default(null) }),
  z.object({ type: z.literal('external_url'), url: httpUrl }),
])

/**
 * Mode de paiement d'un produit, UN SEUL choix :
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
  timezone: timezoneSchema.optional(),
})

export const trackingSettingsSchema = z.object({
  facebookPixelId: z.string().regex(/^\d{5,20}$/).nullable().default(null),
  facebookTestEventCode: z.string().max(40).nullable().default(null),
  tiktokPixelId: z.string().max(40).nullable().default(null),
  /** Jamais renvoyé en clair : seul `hasFacebookAccessToken` sort de l'API. */
  facebookAccessToken: z.string().max(500).nullable().optional(),
})

export const STICKY_TRIGGERS = ['after_hero', 'immediate', 'scroll'] as const
export const stickyCtaSchema = z.object({
  enabled: z.boolean().default(true),
  /** mobile = téléphones seulement ; all = aussi sur ordinateur. */
  devices: z.enum(['mobile', 'all']).default('mobile'),
  position: z.enum(['bottom', 'top']).default('bottom'),
  /** Quand l'afficher : après l'image principale, tout de suite, ou après X % de défilement. */
  trigger: z.enum(STICKY_TRIGGERS).default('after_hero'),
  scrollPercent: z.number().int().min(5).max(90).default(25),
  /** Le masquer quand le formulaire de commande est à l'écran. */
  hideNearForm: z.boolean().default(true),
  /** Vide = texte par défaut. Variables : {produit}, {prix}, {prix_barre}, {boutique}. */
  text: z.string().max(60).default(''),
  showPrice: z.boolean().default(true),
  showThumbnail: z.boolean().default(false),
  animation: z.enum(['none', 'pulse', 'shake']).default('none'),
})
export type StickyCta = z.infer<typeof stickyCtaSchema>
export const STICKY_CTA_DEFAULTS: StickyCta = stickyCtaSchema.parse({})

export const checkoutSettingsSchema = z.object({
  template: templateSchema.default('classic'),
  /**
   * Mise en page sur ordinateur :
   * form_side = contenu à gauche, formulaire à droite ; product_split = style boutique (image à gauche,
   * titre, prix et formulaire à droite, puis le reste en dessous) ; single = une seule colonne.
   */
  desktopLayout: z.enum(['form_side', 'product_split', 'single']).default('form_side'),
  /** Position du titre par rapport à l'image (mise en page « boutique ») : à côté ou au-dessus. */
  titlePosition: z.enum(['beside', 'above']).default('beside'),
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
  /** Bouton d'achat collant qui suit le défilement (page de vente). */
  stickyCta: stickyCtaSchema.default(STICKY_CTA_DEFAULTS),
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
  /** Formulaire de commande de la boutique (tous les produits, sauf surcharge produit). */
  form: orderFormSchema.default(DEFAULT_ORDER_FORM),
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
  productIds: z.array(productIdSchema).default([]),
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
    productId: productIdSchema,
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
    /** Réponses aux champs personnalisés du formulaire, par clé (« cf_xxxx »). */
    customFields: z.record(z.string().regex(/^cf_[a-z0-9]{3,20}$/), z.union([z.string().max(1000), z.array(z.string().max(80)).max(30)])).optional(),
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
        productId: productIdSchema,
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
  /** me = mes commandes, none = non attribuées, ou l'id d'un membre. */
  assigned: z.union([z.enum(['me', 'none']), z.coerce.number().int().positive()]).optional(),
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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10, '10 caractères minimum').max(200),
})

// ─── Réponses API (formes partagées) ─────────────────────────────────────────

export type ApiError = { error: string; code?: string; issues?: unknown }

export interface Me {
  id: number
  email: string
  name: string
  isPlatformAdmin: boolean
  stores: { id: string; name: string; slug: string; role: StoreRole; currency: Currency; permissions: Permission[]; productIds: string[] | null }[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─── Notifications ───────────────────────────────────────────────────────────

export const NOTIFICATION_CHANNELS = ['push', 'email', 'telegram'] as const
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

/**
 * Événements notifiables. `permission` : droit requis pour en être notifié ;
 * les événements liés à des produits respectent en plus le périmètre produits du membre.
 */
export const NOTIFICATION_EVENTS = {
  'order.new': { label: 'Nouvelle commande', description: 'Une commande à la livraison vient d’arriver.', permission: 'orders.view' },
  'order.paid': { label: 'Paiement reçu', description: 'Une vente en ligne est encaissée.', permission: 'orders.view' },
  'order.assigned': { label: 'Commande attribuée', description: 'Quelqu’un vous confie une commande.', permission: 'orders.update' },
  'order.status': { label: 'Statut modifié', description: 'Un membre confirme, expédie, livre ou annule une commande.', permission: 'orders.view' },
  'lead.abandoned': { label: 'Panier abandonné', description: 'Un client a commencé sa commande sans la terminer.', permission: 'customers.view' },
  'team.activity': { label: 'Équipe', description: 'Un membre rejoint l’équipe ou accepte une invitation.', permission: 'team.manage' },
} as const satisfies Record<string, { label: string; description: string; permission: Permission }>
export type NotificationEvent = keyof typeof NOTIFICATION_EVENTS
export const NOTIFICATION_EVENT_KEYS = Object.keys(NOTIFICATION_EVENTS) as NotificationEvent[]

export const channelPrefsSchema = z.object({ push: z.boolean(), email: z.boolean(), telegram: z.boolean() })
export type ChannelPrefs = z.infer<typeof channelPrefsSchema>
export const notificationPrefsSchema = z.partialRecord(z.enum(NOTIFICATION_EVENT_KEYS as [NotificationEvent, ...NotificationEvent[]]), channelPrefsSchema)
export type NotificationPrefs = Partial<Record<NotificationEvent, ChannelPrefs>>

/** Réglages par défaut : push pour tout ce qui concerne le membre ; email pour les ventes côté propriétaire. */
export function defaultChannelPrefs(event: NotificationEvent, role: StoreRole): ChannelPrefs {
  const email = (role === 'owner' || role === 'admin') && (event === 'order.new' || event === 'order.paid')
  return { push: true, email, telegram: true }
}

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  label: z.string().max(120).optional(),
})

export interface NotificationConfig {
  vapidPublicKey: string
  telegram: { enabled: boolean; botUsername: string | null; linked: boolean }
}

export interface NotificationPreferencesView {
  events: { event: NotificationEvent; label: string; description: string; channels: ChannelPrefs }[]
}

export interface NotificationDevice {
  id: number
  label: string
  createdAt: string
  lastUsedAt: string | null
}

/** Contenu d'une notification push (lu par le service worker du dashboard). */
export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
  event: NotificationEvent | 'test'
  /** Joue le son « encaissement » côté app ouverte. */
  sound?: 'sale' | 'soft'
}
