import { sql } from 'drizzle-orm'
import { newId, type IdPrefix } from '../lib/ids'
import {
  bigint,
  bigserial,
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import type {
  CheckoutSettings,
  FulfillmentStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  ProductContent,
  ProductPayment,
  ProductType,
  Promo,
  QuantityOffer,
  MemberOptions,
  NotificationPrefs,
  StoreRole,
  StoreStatus,
  SignupSource,
  PlanId,
  ExpenseCategory,
  Bundle,
  Funnel,
  FunnelRole,
} from '@zuri/shared'

/** Montants : numeric(12,2) lu en `number` (les montants FCFA tiennent large dans un double). */
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' })
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
const createdAt = () => ts('created_at').notNull().defaultNow()
const updatedAt = () =>
  ts('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
const id = () => bigserial('id', { mode: 'number' }).primaryKey()
const fk = (name: string) => bigint(name, { mode: 'number' })
/** Identifiant public non séquentiel (voir lib/ids.ts) et références vers lui. */
const pid = (prefix: IdPrefix) =>
  varchar('id', { length: 40 })
    .primaryKey()
    .$defaultFn(() => newId(prefix))
const ref = (name: string) => varchar(name, { length: 40 })

// ─── Comptes ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: id(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  country: varchar('country', { length: 2 }),
  /** bcrypt (hérité de Laravel) ou argon2id (nouveaux comptes), Bun.password gère les deux. */
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  /** Identifiant Google (« sub ») quand le compte est relié à Google. */
  googleSub: varchar('google_sub', { length: 64 }).unique(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  /** Conversation Telegram reliée au compte (notifications). */
  telegramChatId: varchar('telegram_chat_id', { length: 32 }),
  /** Provenance à l'inscription (premier contact sur le site marketing + page d'origine). */
  signupSource: jsonb('signup_source').$type<SignupSource>(),
  /** Compte suspendu par l'administration de la plateforme (connexion refusée). */
  disabledAt: ts('disabled_at'),
  /** Options activées pour ce compte (ex. paiements en ligne), réglées par le super admin. */
  features: jsonb('features').$type<Record<string, boolean>>(),
  /** Ne veut plus recevoir les emails d'accompagnement (relances de démarrage). Les emails de compte partent toujours. */
  emailOptOutAt: ts('email_opt_out_at'),
  lastLoginAt: ts('last_login_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 du jeton : un vol de la base ne donne pas de sessions utilisables. */
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: ts('expires_at').notNull(),
    ip: varchar('ip', { length: 64 }),
    userAgent: varchar('user_agent', { length: 512 }),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

/** Liens « mot de passe oublié » : seul le SHA-256 du jeton est stocké, usage unique, 30 min. */
export const passwordResets = pgTable(
  'password_resets',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('password_resets_user_idx').on(t.userId)],
)

/** Appareils déjà vus par compte (cookie appareil haché) : alerte à la connexion depuis un nouvel appareil. */
export const userDevices = pgTable(
  'user_devices',
  {
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceHash: varchar('device_hash', { length: 64 }).notNull(),
    userAgent: varchar('user_agent', { length: 512 }),
    lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.deviceHash] })],
)

// ─── Notifications ───────────────────────────────────────────────────────────

/** Choix des canaux par événement, par membre et par boutique (absent = valeurs par défaut du rôle). */
export const notificationSettings = pgTable(
  'notification_settings',
  {
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    prefs: jsonb('prefs').$type<NotificationPrefs>().notNull().default({}),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.storeId] })],
)

/** Appareils abonnés aux notifications push (téléphone, PC…). */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: id(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: varchar('p256dh', { length: 200 }).notNull(),
    auth: varchar('auth', { length: 100 }).notNull(),
    label: varchar('label', { length: 120 }).notNull(),
    lastUsedAt: ts('last_used_at'),
    createdAt: createdAt(),
  },
  (t) => [index('push_subscriptions_user_idx').on(t.userId)],
)

/**
 * Clés API personnelles (IA, MCP, automatisations). Une clé agit au nom de son propriétaire,
 * jamais avec plus de droits que lui ; elle peut être limitée à une boutique et à la lecture seule.
 * Seule l'empreinte SHA-256 est gardée : la clé complète n'est montrée qu'une fois.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: id(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** null = toutes les boutiques du compte. */
    storeId: ref('store_id').references(() => stores.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    /** Début visible de la clé (zk_live_abcd…), pour la reconnaître dans la liste. */
    prefix: varchar('prefix', { length: 20 }).notNull(),
    keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
    scope: varchar('scope', { length: 10 }).$type<'read' | 'write'>().notNull().default('write'),
    lastUsedAt: ts('last_used_at'),
    revokedAt: ts('revoked_at'),
    createdAt: createdAt(),
  },
  (t) => [index('api_keys_user_idx').on(t.userId)],
)

/** Codes à usage unique pour relier un compte à Telegram (/start <code>), 15 min. */
export const telegramLinks = pgTable('telegram_links', {
  codeHash: varchar('code_hash', { length: 64 }).primaryKey(),
  userId: fk('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
})

/** Secrets générés par l'application elle-même (clés VAPID…), chiffrés avec APP_KEY. */
export const appSecrets = pgTable('app_secrets', {
  key: varchar('key', { length: 60 }).primaryKey(),
  valueEnc: text('value_enc').notNull(),
  createdAt: createdAt(),
})

// ─── Boutiques (tenants) ─────────────────────────────────────────────────────

export const stores = pgTable('stores', {
  id: pid('shp'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  subdomain: varchar('subdomain', { length: 80 }).unique(),
  customDomain: varchar('custom_domain', { length: 255 }).unique(),
  customDomainVerifiedAt: ts('custom_domain_verified_at'),
  currency: varchar('currency', { length: 5 }).notNull().default('XOF'),
  locale: varchar('locale', { length: 5 }).notNull().default('fr'),
  country: varchar('country', { length: 2 }).notNull().default('BJ'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('Africa/Lagos'),
  supportPhone: varchar('support_phone', { length: 30 }),
  supportEmail: varchar('support_email', { length: 255 }),
  /** Secret (chiffré) des webhooks d'intégration entrants (ventes Selar via n8n…). */
  integrationSecretEnc: text('integration_secret_enc'),
  /** Boutique de produits physiques (livrés, paiement à la livraison possible) OU de produits digitaux : jamais les deux. */
  kind: varchar('kind', { length: 10 }).$type<ProductType>().notNull().default('physical'),
  /** active | paused (boutique fermée temporairement, aucune commande) | closed (fermée définitivement). */
  status: varchar('status', { length: 10 }).$type<StoreStatus>().notNull().default('active'),
  pausedAt: ts('paused_at'),
  /** Message affiché aux visiteurs pendant la pause. */
  pauseMessage: varchar('pause_message', { length: 300 }),
  closedAt: ts('closed_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const storeMembers = pgTable(
  'store_members',
  {
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).$type<StoreRole>().notNull().default('owner'),
    /** Options en plus du rôle (voir le CA, exporter). */
    options: jsonb('options').$type<MemberOptions>().notNull().default({ viewRevenue: false, exportData: false }),
    /** false = accès limité aux produits listés dans store_member_products. */
    allProducts: boolean('all_products').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.userId] }), index('store_members_user_idx').on(t.userId)],
)

/** Périmètre produits d'un membre (quand allProducts = false). */
export const storeMemberProducts = pgTable(
  'store_member_products',
  {
    storeId: ref('store_id').notNull(),
    userId: fk('user_id').notNull(),
    productId: ref('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.storeId, t.userId, t.productId] }),
    foreignKey({ columns: [t.storeId, t.userId], foreignColumns: [storeMembers.storeId, storeMembers.userId] }).onDelete('cascade'),
  ],
)

/** Invitations d'équipe : seul le SHA-256 du jeton est stocké, valables 7 jours. */
export const storeInvitations = pgTable(
  'store_invitations',
  {
    id: pid('inv'),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).$type<StoreRole>().notNull(),
    productIds: jsonb('product_ids').$type<string[] | null>(),
    options: jsonb('options').$type<MemberOptions>().notNull().default({ viewRevenue: false, exportData: false }),
    invitedBy: fk('invited_by').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: ts('expires_at').notNull(),
    acceptedAt: ts('accepted_at'),
    acceptedBy: fk('accepted_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('store_invitations_store_idx').on(t.storeId)],
)

/**
 * Journal d'activité hors commandes (produits, promos, zones, réglages, équipe).
 * Les actions sur les commandes vivent dans order_events ; le fil d'activité fusionne les deux.
 */
export const activityLog = pgTable(
  'activity_log',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    userId: fk('user_id').references(() => users.id, { onDelete: 'set null' }),
    entityType: varchar('entity_type', { length: 30 }).notNull(),
    entityId: varchar('entity_id', { length: 40 }),
    entityLabel: varchar('entity_label', { length: 255 }),
    action: varchar('action', { length: 40 }).notNull(),
    message: text('message').notNull(),
    /** Produits concernés : un membre limité à certains produits ne voit que ce qui les touche. */
    productIds: jsonb('product_ids').$type<string[]>(),
    data: jsonb('data').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index('activity_log_store_created_idx').on(t.storeId, t.createdAt)],
)

export const checkoutSettings = pgTable('checkout_settings', {
  storeId: ref('store_id')
    .primaryKey()
    .references(() => stores.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').$type<CheckoutSettings>().notNull(),
  facebookPixelId: varchar('facebook_pixel_id', { length: 30 }),
  facebookTestEventCode: varchar('facebook_test_event_code', { length: 40 }),
  tiktokPixelId: varchar('tiktok_pixel_id', { length: 40 }),
  /** Chiffré (AES-256-GCM, voir lib/crypto.ts). */
  facebookAccessTokenEnc: text('facebook_access_token_enc'),
  updatedAt: updatedAt(),
})

/** Identifiants des moyens de paiement, PAR boutique, chiffrés. */
export const paymentAccounts = pgTable(
  'payment_accounts',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 20 }).$type<PaymentProvider>().notNull(),
    enabled: boolean('enabled').notNull().default(false),
    mode: varchar('mode', { length: 10 }).$type<'sandbox' | 'live'>().notNull().default('sandbox'),
    /** JSON chiffré : { sandbox: {...}, live: {...} } */
    credentialsEnc: text('credentials_enc'),
    /** Secret de webhook propre à ce compte (URL de webhook par boutique). */
    webhookToken: varchar('webhook_token', { length: 64 }).notNull(),
    /** Réglages non secrets propres au provider (ex. Payment Orchestrator : mode du widget, pays autorisés). */
    settings: jsonb('settings').$type<Record<string, unknown> | null>(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('payment_accounts_store_provider_uq').on(t.storeId, t.provider), uniqueIndex('payment_accounts_webhook_uq').on(t.webhookToken)],
)

// ─── Catalogue ───────────────────────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    id: pid('prd'),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 10 }).$type<ProductType>().notNull().default('digital'),
    name: varchar('name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(false),
    description: text('description').notNull().default(''),
    price: money('price').notNull(),
    compareAtPrice: money('compare_at_price'),
    /** Prix d'achat unitaire (coût de revient) : sert au calcul du bénéfice réel. */
    costPrice: money('cost_price'),
    baseCurrency: varchar('base_currency', { length: 5 }).notNull().default('XOF'),
    currencyPrices: jsonb('currency_prices').$type<{ currency: string; price: number }[]>().notNull().default([]),
    promo: jsonb('promo').$type<Promo>().notNull().default({ type: 'none', value: 0, display: 'strikethrough' }),
    offers: jsonb('offers').$type<QuantityOffer[]>().notNull().default([]),
    coverImage: varchar('cover_image', { length: 500 }),
    thumbnail: varchar('thumbnail', { length: 500 }),
    content: jsonb('content').$type<ProductContent>().notNull(),
    payment: jsonb('payment').$type<ProductPayment>().notNull(),
    /** Digital : livraison. */
    delivery: jsonb('delivery').$type<{ type: 'file'; filePath: string | null } | { type: 'external_url'; url: string } | null>(),
    /** Pack : liste des produits inclus (null = produit simple). */
    bundle: jsonb('bundle').$type<Bundle | null>(),
    /** Tunnel de vente : order bump, upsells, downsells, page de remerciement. */
    funnel: jsonb('funnel').$type<Funnel | null>(),
    /** Ancien identifiant numérique (Sellit v1) : redirige les vieux liens de pub /p/123. */
    legacyId: integer('legacy_id'),
    /** Code produit Selar (webhook externe). */
    externalProductId: varchar('external_product_id', { length: 100 }),
    // Physique
    sku: varchar('sku', { length: 60 }),
    trackInventory: boolean('track_inventory').notNull().default(false),
    stock: integer('stock'),
    weightGrams: integer('weight_grams'),
    variantLabel: varchar('variant_label', { length: 40 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('products_store_idx').on(t.storeId),
    uniqueIndex('products_store_external_uq').on(t.storeId, t.externalProductId).where(sql`${t.externalProductId} is not null`),
  ],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: id(),
    productId: ref('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    sku: varchar('sku', { length: 60 }),
    price: money('price'),
    /** Prix d'achat propre à la variante (null = celui du produit). */
    costPrice: money('cost_price'),
    stock: integer('stock'),
    isActive: boolean('is_active').notNull().default(true),
    position: smallint('position').notNull().default(0),
  },
  (t) => [index('product_variants_product_idx').on(t.productId)],
)

// ─── Livraison & promo ───────────────────────────────────────────────────────

export const deliveryZones = pgTable(
  'delivery_zones',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    cities: jsonb('cities').$type<string[]>().notNull().default([]),
    fee: money('fee').notNull().default(0),
    freeAbove: money('free_above'),
    /** Ce que le livreur te facture réellement pour une livraison dans cette zone (peut différer des frais client). */
    courierCost: money('courier_cost'),
    /** Coût d'un retour (colis refusé) : souvent payé en COD même sans encaissement. */
    returnCost: money('return_cost'),
    codAllowed: boolean('cod_allowed').notNull().default(true),
    etaLabel: varchar('eta_label', { length: 60 }),
    isActive: boolean('is_active').notNull().default(true),
    position: smallint('position').notNull().default(0),
  },
  (t) => [index('delivery_zones_store_idx').on(t.storeId)],
)

export const promoCodes = pgTable(
  'promo_codes',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 30 }).notNull(),
    type: varchar('type', { length: 12 }).$type<'percentage' | 'fixed'>().notNull(),
    value: money('value').notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    minSubtotal: money('min_subtotal'),
    productIds: jsonb('product_ids').$type<string[]>().notNull().default([]),
    startsAt: ts('starts_at'),
    endsAt: ts('ends_at'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('promo_codes_store_code_uq').on(t.storeId, t.code)],
)

// ─── Clients ─────────────────────────────────────────────────────────────────

/** Un client = un numéro de téléphone par boutique (clé naturelle en Afrique). */
export const customers = pgTable(
  'customers',
  {
    id: pid('cus'),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 30 }).notNull(),
    name: varchar('name', { length: 120 }),
    email: varchar('email', { length: 255 }),
    city: varchar('city', { length: 120 }),
    address: varchar('address', { length: 500 }),
    ordersCount: integer('orders_count').notNull().default(0),
    deliveredCount: integer('delivered_count').notNull().default(0),
    returnedCount: integer('returned_count').notNull().default(0),
    totalSpent: money('total_spent').notNull().default(0),
    /** Bloqué : refus répétés, faux numéros… (les commandes COD sont signalées). */
    isBlocked: boolean('is_blocked').notNull().default(false),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('customers_store_phone_uq').on(t.storeId, t.phone), index('customers_store_email_idx').on(t.storeId, t.email)],
)

// ─── Commandes ───────────────────────────────────────────────────────────────

export const orders = pgTable(
  'orders',
  {
    id: pid('ord'),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
    /** Jeton opaque pour l'accès public (page succès, téléchargement). Remplace les ID séquentiels. */
    accessToken: varchar('access_token', { length: 64 }).notNull().unique(),
    customerId: ref('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 120 }),
    customerEmail: varchar('customer_email', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 30 }),
    city: varchar('city', { length: 120 }),
    address: varchar('address', { length: 500 }),
    deliveryZoneId: fk('delivery_zone_id').references(() => deliveryZones.id, { onDelete: 'set null' }),
    customerNote: varchar('customer_note', { length: 500 }),
    /** digital | physical | mixed, pour filtrer vite sans joindre les lignes. */
    kind: varchar('kind', { length: 10 }).$type<ProductType | 'mixed'>().notNull(),
    subtotal: money('subtotal').notNull(),
    discount: money('discount').notNull().default(0),
    shippingFee: money('shipping_fee').notNull().default(0),
    total: money('total').notNull(),
    // Payment Orchestrator : session de paiement, transaction réussie, état, mode test/live.
    poSessionId: varchar('po_session_id', { length: 80 }),
    poTransactionId: varchar('po_transaction_id', { length: 80 }),
    /** unpaid | paid | failed | expired | refunded | mismatch */
    poStatus: varchar('po_status', { length: 20 }),
    poLivemode: boolean('po_livemode'),
    /** Numéro de la session (une nouvelle session si le total change ou après expiration). */
    poSessionSeq: smallint('po_session_seq').notNull().default(0),
    /** Prestataire et opérateur réellement utilisés (pawapay, mtn…), raison d'échec. */
    poProvider: varchar('po_provider', { length: 30 }),
    poOperator: varchar('po_operator', { length: 30 }),
    poCountry: varchar('po_country', { length: 2 }),
    poFailure: varchar('po_failure', { length: 300 }),
    /** Dernière vérification serveur de la session (réconciliation toutes les 15 min). */
    poCheckedAt: ts('po_checked_at'),
    /** Coût réel du livreur pour cette commande (copié de la zone à la création, modifiable). */
    deliveryCost: money('delivery_cost'),
    /** Coût du retour si la commande est refusée (copié de la zone, modifiable). */
    returnCost: money('return_cost'),
    currency: varchar('currency', { length: 5 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 20 }).$type<PaymentMethod>().notNull(),
    paymentStatus: varchar('payment_status', { length: 12 }).$type<PaymentStatus>().notNull().default('pending'),
    paymentProvider: varchar('payment_provider', { length: 20 }),
    paymentRef: varchar('payment_ref', { length: 255 }),
    paidAt: ts('paid_at'),
    fulfillmentStatus: varchar('fulfillment_status', { length: 12 }).$type<FulfillmentStatus>().notNull().default('new'),
    confirmedAt: ts('confirmed_at'),
    shippedAt: ts('shipped_at'),
    deliveredAt: ts('delivered_at'),
    cancelledAt: ts('cancelled_at'),
    returnedAt: ts('returned_at'),
    callAttempts: smallint('call_attempts').notNull().default(0),
    courier: varchar('courier', { length: 80 }),
    trackingNumber: varchar('tracking_number', { length: 80 }),
    promoCodeId: fk('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
    promoCode: varchar('promo_code', { length: 30 }),
    source: varchar('source', { length: 20 }).notNull().default('storefront'),
    utmSource: varchar('utm_source', { length: 255 }),
    utmMedium: varchar('utm_medium', { length: 255 }),
    utmCampaign: varchar('utm_campaign', { length: 255 }),
    utmContent: varchar('utm_content', { length: 255 }),
    referrer: varchar('referrer', { length: 2048 }),
    sessionId: varchar('session_id', { length: 64 }),
    /** Visiteur persistant de la boutique : relie la commande à toutes ses visites (attribution premier / dernier clic). */
    visitorId: varchar('visitor_id', { length: 64 }),
    /** Partagé pixel ↔ Conversions API. */
    eventId: varchar('event_id', { length: 64 }).notNull(),
    trackingContext: jsonb('tracking_context').$type<{ ip?: string; userAgent?: string; fbp?: string; fbc?: string }>(),
    /** Marque l'envoi unique des effets de bord (emails, CAPI…), idempotence. */
    fulfilledEffectsAt: ts('fulfilled_effects_at'),
    /** Membre qui traite la commande (« Je prends » ou attribution). */
    assignedTo: fk('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    assignedAt: ts('assigned_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    /** Commande archivée : masquée des listes par défaut, toujours consultable et comptée dans les statistiques. */
    archivedAt: ts('archived_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('orders_store_created_idx').on(t.storeId, t.createdAt),
    index('orders_po_session_idx').on(t.poSessionId),
    index('orders_store_archived_idx').on(t.storeId, t.archivedAt),
    index('orders_store_fulfillment_idx').on(t.storeId, t.fulfillmentStatus),
    index('orders_store_payment_idx').on(t.storeId, t.paymentStatus),
    index('orders_customer_idx').on(t.customerId),
    index('orders_payment_ref_idx').on(t.paymentRef),
    index('orders_store_assigned_idx').on(t.storeId, t.assignedTo),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: id(),
    orderId: ref('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: ref('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: fk('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    productType: varchar('product_type', { length: 10 }).$type<ProductType>().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 80 }),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    /** Prix d'achat unitaire au moment de la commande (le bénéfice d'hier ne change pas si le coût change). */
    unitCost: money('unit_cost'),
    /** main | bump | upsell | downsell : origine de la ligne dans le tunnel de vente. */
    role: varchar('role', { length: 10 }).$type<FunnelRole>().notNull().default('main'),
    /** Pack : contenu figé à la commande (livraison des fichiers, stock, coût). */
    bundle: jsonb('bundle').$type<{ productId: string; variantId: number | null; name: string; quantity: number }[] | null>(),
    total: money('total').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId), index('order_items_product_idx').on(t.productId)],
)

/** Événements webhook Payment Orchestrator déjà traités (un même événement peut arriver plusieurs fois). */
export const poWebhookEvents = pgTable('po_webhook_events', {
  eventId: varchar('event_id', { length: 80 }).primaryKey(),
  type: varchar('type', { length: 40 }),
  receivedAt: createdAt(),
})

/** Dépenses de la boutique (publicité, emballage, salaires, outils…) déduites du bénéfice réel. */
export const storeExpenses = pgTable(
  'store_expenses',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /** Jour de la dépense (date locale de la boutique). */
    spentOn: date('spent_on', { mode: 'string' }).notNull(),
    category: varchar('category', { length: 20 }).$type<ExpenseCategory>().notNull(),
    amount: money('amount').notNull(),
    label: varchar('label', { length: 160 }),
    /** Dépense liée à un produit (ex. pub d'une campagne produit) : bénéfice par produit. */
    productId: ref('product_id').references(() => products.id, { onDelete: 'set null' }),
    createdBy: fk('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('store_expenses_store_day_idx').on(t.storeId, t.spentOn)],
)

/** Historique d'une commande (statuts, appels, notes), affiché en timeline. */
export const orderEvents = pgTable(
  'order_events',
  {
    id: id(),
    orderId: ref('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(),
    message: text('message'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    userId: fk('user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('order_events_order_idx').on(t.orderId)],
)

export const paymentTransactions = pgTable(
  'payment_transactions',
  {
    id: id(),
    orderId: ref('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 20 }).notNull(),
    providerRef: varchar('provider_ref', { length: 255 }),
    country: varchar('country', { length: 2 }),
    network: varchar('network', { length: 30 }),
    phone: varchar('phone', { length: 30 }),
    status: varchar('status', { length: 15 }).$type<'processing' | 'otp_required' | 'redirect' | 'paid' | 'failed'>().notNull(),
    amount: money('amount').notNull(),
    currency: varchar('currency', { length: 5 }).notNull(),
    providerResponse: jsonb('provider_response'),
    webhookPayload: jsonb('webhook_payload'),
    errorMessage: varchar('error_message', { length: 500 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('payment_tx_order_idx').on(t.orderId), uniqueIndex('payment_tx_provider_ref_uq').on(t.provider, t.providerRef)],
)

export const downloads = pgTable(
  'downloads',
  {
    id: id(),
    orderId: ref('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: ref('product_id').references(() => products.id, { onDelete: 'set null' }),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [index('downloads_order_idx').on(t.orderId)],
)

// ─── Marketing ───────────────────────────────────────────────────────────────

/** Paniers abandonnés : la personne a laissé ses coordonnées sans finaliser. */
export const leads = pgTable(
  'leads',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    productId: ref('product_id').references(() => products.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    name: varchar('name', { length: 120 }),
    source: varchar('source', { length: 20 }).notNull().default('checkout'),
    reminderCount: smallint('reminder_count').notNull().default(0),
    lastRemindedAt: ts('last_reminded_at'),
    nextReminderAt: ts('next_reminder_at'),
    convertedAt: ts('converted_at'),
    convertedOrderId: ref('converted_order_id').references(() => orders.id, { onDelete: 'set null' }),
    /** Vendeur(s) prévenu(s) du panier abandonné. */
    sellerNotifiedAt: ts('seller_notified_at'),
    /** Ignoré par le vendeur (« Ne plus relancer ») : plus aucune relance, visible dans l'onglet Ignorés. */
    ignoredAt: ts('ignored_at'),
    reminderHistory: jsonb('reminder_history').$type<{ step: number; channel: string; at: string; promoCode?: string }[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('leads_store_created_idx').on(t.storeId, t.createdAt),
    index('leads_due_idx').on(t.nextReminderAt).where(sql`${t.convertedAt} is null`),
    uniqueIndex('leads_store_product_email_uq').on(t.storeId, t.productId, t.email),
  ],
)

export const pageEvents = pgTable(
  'page_events',
  {
    id: id(),
    storeId: ref('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    productId: ref('product_id').references(() => products.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 30 }).notNull(),
    sessionId: varchar('session_id', { length: 64 }).notNull(),
    /** Visiteur persistant (localStorage) : un même visiteur revenu demain ou dans un autre onglet compte une fois. */
    visitorId: varchar('visitor_id', { length: 64 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    referrer: varchar('referrer', { length: 2048 }),
    utmSource: varchar('utm_source', { length: 255 }),
    utmMedium: varchar('utm_medium', { length: 255 }),
    utmCampaign: varchar('utm_campaign', { length: 255 }),
    deviceType: varchar('device_type', { length: 20 }),
    country: varchar('country', { length: 2 }),
    /** Position approximative du visiteur (ville, fournie par Cloudflare, arrondie à ~1 km) : vue en direct sur le globe. */
    city: varchar('city', { length: 120 }),
    region: varchar('region', { length: 120 }),
    latitude: real('latitude'),
    longitude: real('longitude'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [
    index('page_events_store_created_idx').on(t.storeId, t.createdAt),
    index('page_events_store_type_idx').on(t.storeId, t.eventType, t.createdAt),
    // Parcours d'un acheteur : toutes ses visites (attribution premier / dernier clic).
    index('page_events_store_visitor_idx').on(t.storeId, t.visitorId),
    index('page_events_store_session_idx').on(t.storeId, t.sessionId),
  ],
)

export type User = typeof users.$inferSelect
export type Store = typeof stores.$inferSelect
export type Product = typeof products.$inferSelect
export type ProductVariant = typeof productVariants.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type DeliveryZone = typeof deliveryZones.$inferSelect
export type PromoCode = typeof promoCodes.$inferSelect
export type Customer = typeof customers.$inferSelect
export type PaymentAccount = typeof paymentAccounts.$inferSelect

// ─── Plateforme : réglages, abonnements ──────────────────────────────────────

/** Réglages globaux de la plateforme (clé → valeur JSON), modifiés par le super admin. */
export const platformSettings = pgTable('platform_settings', {
  key: varchar('key', { length: 60 }).primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: updatedAt(),
})

/** Abonnement d'un compte (un par compte, couvre toutes ses boutiques). */
export const subscriptions = pgTable('subscriptions', {
  userId: fk('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 20 }).$type<PlanId>().notNull(),
  /** Fin de la période payée ou offerte. Après cette date, le compte repasse à l'offre gratuite (ou expirée). */
  currentPeriodEnd: ts('current_period_end').notNull(),
  /** offered (offert par la plateforme) | paid */
  source: varchar('source', { length: 10 }).notNull().default('paid'),
  note: varchar('note', { length: 300 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/** Paiements d'abonnement (Mobile Money via FedaPay, FeexPay ou pawaPay, sur le compte de la plateforme). */
export const billingPayments = pgTable(
  'billing_payments',
  {
    id: id(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: varchar('plan', { length: 20 }).$type<PlanId>().notNull(),
    months: smallint('months').notNull(),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 5 }).notNull(),
    provider: varchar('provider', { length: 20 }).$type<PaymentProvider>().notNull(),
    providerRef: varchar('provider_ref', { length: 255 }),
    /** pending | paid | failed */
    status: varchar('status', { length: 10 }).notNull().default('pending'),
    phone: varchar('phone', { length: 30 }),
    paidAt: ts('paid_at'),
    createdAt: createdAt(),
  },
  (t) => [index('billing_payments_user_idx').on(t.userId, t.createdAt), index('billing_payments_ref_idx').on(t.providerRef)],
)

// ─── Contact et accompagnement des vendeurs ──────────────────────────────────

/** Messages envoyés depuis la page contact du site (lus dans le super admin). */
export const contactMessages = pgTable(
  'contact_messages',
  {
    id: id(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 40 }),
    message: text('message').notNull(),
    /** Page d'où le message a été envoyé, et langue du site. */
    page: varchar('page', { length: 200 }),
    lang: varchar('lang', { length: 2 }),
    ip: varchar('ip', { length: 64 }),
    /** new | done */
    status: varchar('status', { length: 10 }).notNull().default('new'),
    handledAt: ts('handled_at'),
    createdAt: createdAt(),
  },
  (t) => [index('contact_messages_status_idx').on(t.status, t.createdAt)],
)

/** Emails d'accompagnement déjà envoyés à un vendeur (une fois par étape). */
export const onboardingEmails = pgTable(
  'onboarding_emails',
  {
    id: id(),
    userId: fk('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** no_store | no_product | no_order */
    kind: varchar('kind', { length: 20 }).notNull(),
    step: smallint('step').notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('onboarding_emails_uq').on(t.userId, t.kind, t.step)],
)
