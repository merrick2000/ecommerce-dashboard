/**
 * Outils MCP de Zuri : ce qu'une IA (Claude, ChatGPT, Cursor…) peut faire sur les boutiques.
 *
 * Chaque outil appelle l'API REST existante AVEC la clé de l'utilisateur : mêmes routes, mêmes
 * validations, mêmes permissions (rôle, périmètre produits, montants masqués), même journal
 * d'activité. Aucun outil ne contourne les règles d'accès.
 */
import { z } from 'zod'
import { env } from '../../lib/env'

export interface ToolContext {
  call: <T = any>(method: string, path: string, opts?: { query?: Record<string, unknown>; body?: unknown }) => Promise<T>
  /** Boutique imposée par la clé (null = toutes celles du compte). */
  keyStoreId: string | null
}

export interface Tool {
  name: string
  title: string
  description: string
  input: z.ZodObject<any>
  /** Lecture seule : visible aussi avec une clé « lecture ». */
  readOnly?: boolean
  destructive?: boolean
  run: (args: any, ctx: ToolContext) => Promise<unknown>
}

export class ToolError extends Error {}

// ─── Aides ───────────────────────────────────────────────────────────────────

const storeArg = z.string().max(40).optional().describe('Store id (shp_…). Optional when the account (or the API key) has a single store.')
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date YYYY-MM-DD')

async function resolveStore(ctx: ToolContext, storeId?: string): Promise<string> {
  if (storeId) return storeId
  if (ctx.keyStoreId) return ctx.keyStoreId
  const me = await ctx.call<{ stores: { id: string; name: string; slug: string }[] }>('GET', '/auth/me')
  if (me.stores.length === 1) return me.stores[0]!.id
  if (!me.stores.length) throw new ToolError('This account has no store yet.')
  throw new ToolError(`Several stores on this account, pass storeId. Stores: ${me.stores.map((s) => `${s.name} (${s.id})`).join(', ')}`)
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Fusion profonde : les objets fusionnent, les tableaux et valeurs simples remplacent. undefined = inchangé. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch) || !isPlainObject(base)) return (patch === undefined ? base : patch) as T
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v
  }
  return out as T
}

const strip = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>

/** Base des images déjà hébergées chez nous (pas besoin de les ré-importer). */
const ownMedia = () => (env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
const isOwn = (u: string) => !/^https?:\/\//.test(u) || (!!ownMedia() && u.startsWith(ownMedia()))

async function rehost(ctx: ToolContext, storeId: string, url: string, preset: 'cover' | 'thumbnail' | 'gallery' | 'content'): Promise<string> {
  if (isOwn(url)) return url
  const r = await ctx.call<{ url: string | null; key: string }>('POST', `/stores/${storeId}/uploads/image-url`, { body: { url, preset } })
  return r.url ?? r.key
}

/** Images externes d'un produit (couverture, galerie) rapatriées sur le CDN Zuri avant enregistrement. */
async function rehostProductImages(ctx: ToolContext, storeId: string, p: Record<string, any>) {
  if (typeof p.coverImage === 'string' && p.coverImage) {
    const external = !isOwn(p.coverImage)
    p.coverImage = await rehost(ctx, storeId, p.coverImage, 'cover')
    if (external || !p.thumbnail) p.thumbnail = p.thumbnail && isOwn(p.thumbnail) && !external ? p.thumbnail : p.coverImage
  }
  if (typeof p.thumbnail === 'string' && p.thumbnail && !isOwn(p.thumbnail)) p.thumbnail = await rehost(ctx, storeId, p.thumbnail, 'thumbnail')
  if (Array.isArray(p.content?.gallery)) {
    p.content.gallery = await Promise.all(p.content.gallery.map((u: string) => rehost(ctx, storeId, u, 'gallery')))
  }
}

function salesPageUrl(store: { slug: string; subdomain?: string | null }, productId: string) {
  return `https://${store.subdomain || store.slug}.${env.BASE_DOMAIN}/p/${productId}`
}

/** Date locale (YYYY-MM-DD) dans le fuseau de la boutique. */
function localDay(tz: string, d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
const shift = (day: string, days: number) => new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10)

export const PERIODS = ['today', 'yesterday', 'this_week', 'last_week', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'last_90_days', 'this_year', 'last_year', 'all_time'] as const
const periodArg = z.enum(PERIODS).optional().describe('Preset period in the store timezone. Weeks start on Monday. Ignored when from/to are given.')

export function periodRange(period: (typeof PERIODS)[number], tz: string, now = new Date()): { from: string; to: string } {
  const today = localDay(tz, now)
  const [y, m] = today.split('-').map(Number) as [number, number]
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7 // lundi = 0
  const monthStart = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, '0')}-01`
  switch (period) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: shift(today, -1), to: shift(today, -1) }
    case 'this_week':
      return { from: shift(today, -dow), to: today }
    case 'last_week':
      return { from: shift(today, -dow - 7), to: shift(today, -dow - 1) }
    case 'last_7_days':
      return { from: shift(today, -6), to: today }
    case 'last_30_days':
      return { from: shift(today, -29), to: today }
    case 'last_90_days':
      return { from: shift(today, -89), to: today }
    case 'this_month':
      return { from: monthStart(y, m), to: today }
    case 'last_month': {
      const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1]
      return { from: monthStart(py, pm), to: shift(monthStart(y, m), -1) }
    }
    case 'this_year':
      return { from: `${y}-01-01`, to: today }
    case 'last_year':
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }
    case 'all_time':
      return { from: '2024-01-01', to: today }
  }
}

async function storeInfo(ctx: ToolContext, storeId: string) {
  return ctx.call<{ id: string; name: string; slug: string; subdomain: string | null; timezone: string; currency: string }>('GET', `/stores/${storeId}`)
}

async function rangeFor(ctx: ToolContext, storeId: string, a: { period?: (typeof PERIODS)[number]; from?: string; to?: string }) {
  if (a.from || a.to) {
    const to = a.to ?? localDay((await storeInfo(ctx, storeId)).timezone)
    return { from: a.from ?? to, to }
  }
  const tz = (await storeInfo(ctx, storeId)).timezone
  return periodRange(a.period ?? 'last_30_days', tz)
}

const pct = (cur: number | null | undefined, prev: number | null | undefined) => (cur == null || prev == null ? null : prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / prev) * 1000) / 10)

/** Commande résumée pour les listes (lisible par une IA, sans le bruit). */
function orderRow(o: any) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    customer: o.customerName,
    phone: o.customerPhone,
    city: o.city,
    items: (o.items ?? []).map((i: any) => `${i.quantity} x ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`).join(', '),
    total: o.total,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.fulfillmentStatus,
    assignedTo: o.assigneeName,
    archived: Boolean(o.archivedAt),
    source: o.source,
    utmSource: o.utmSource,
  }
}

// ─── Schémas produit (forme de l'API, tout optionnel pour les modifications) ──

const faq = z.object({ question: z.string().max(300), answer: z.string().max(3000) })
const testimonial = z.object({ name: z.string().max(80), city: z.string().max(80).optional(), rating: z.number().int().min(1).max(5).optional(), text: z.string().max(1000) })
const offer = z.object({ id: z.string().max(40).describe('Stable id, e.g. "pack2"'), quantity: z.number().int().min(1).max(100), price: z.number().min(0).describe('Total price for this quantity'), label: z.string().max(80).optional(), badge: z.string().max(30).optional() })
const variant = z.object({ id: z.number().int().optional().describe('Existing variant id to keep it (omit for a new one)'), name: z.string().max(80), sku: z.string().max(60).nullable().optional(), price: z.number().min(0).nullable().optional(), stock: z.number().int().min(0).nullable().optional(), isActive: z.boolean().optional() })

const productFields = z.object({
  type: z.enum(['physical', 'digital']).optional().describe('physical = delivered (cash on delivery possible), digital = ebook, course, file. Default physical.'),
  name: z.string().min(2).max(160).optional(),
  isActive: z.boolean().optional().describe('true = on sale (sales page accepts orders)'),
  description: z.string().max(200_000).optional().describe('Sales page body, HTML (p, h2, h3, ul, li, strong, em, img, a).'),
  price: z.number().min(0).optional().describe('Price in the store currency (e.g. XOF, no decimals for FCFA)'),
  compareAtPrice: z.number().min(0).nullable().optional().describe('Old price shown struck through (must be higher than price)'),
  coverImage: z.string().max(2000).nullable().optional().describe('Main image URL. External URLs are downloaded and hosted on Zuri automatically.'),
  thumbnail: z.string().max(2000).nullable().optional(),
  offers: z.array(offer).max(6).optional().describe('Quantity bundles (physical only), e.g. 2 for 25000'),
  variantLabel: z.string().max(40).nullable().optional().describe('e.g. "Taille", "Couleur"'),
  variants: z.array(variant).max(50).optional().describe('Replaces the whole variant list'),
  trackInventory: z.boolean().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  sku: z.string().max(60).nullable().optional(),
  weightGrams: z.number().int().min(0).nullable().optional(),
  promo: z.object({ type: z.enum(['none', 'percentage', 'fixed']), value: z.number().min(0), display: z.enum(['strikethrough', 'badge', 'both']).optional() }).partial().optional(),
  payment: z
    .object({
      method: z.enum(['cod', 'native', 'integration']).describe('cod = cash on delivery (physical), native = Mobile Money / card through the store payment accounts, integration = external platform (Chariow, Maketou, Selar, link)'),
      integration: z.object({ platform: z.string(), productId: z.string().optional(), url: z.string().optional() }).passthrough().nullable().optional(),
    })
    .optional(),
  content: z
    .object({
      kicker: z.string().max(80).optional().describe('Small line above the title'),
      headline: z.string().max(160).optional().describe('Big catchy title shown instead of the name'),
      tagline: z.string().max(300).optional().describe('Short sentence under the title'),
      customText: z.string().max(20_000).optional(),
      features: z.array(z.string().max(200)).max(30).optional().describe('Key benefits (bullet list)'),
      featuresPosition: z.enum(['before_description', 'after_description', 'hidden']).optional(),
      faqs: z.array(faq).max(40).optional(),
      testimonials: z.array(testimonial).max(40).optional(),
      testimonialsStyle: z.enum(['cards', 'minimal', 'highlight']).optional(),
      gallery: z.array(z.string().max(2000)).max(12).optional().describe('Extra images (URLs), replaces the gallery'),
      video: z.object({ url: z.string().url(), title: z.string().max(120).optional(), position: z.enum(['before_description', 'after_description', 'after_hero']).optional() }).nullable().optional(),
      whatsapp: z.object({ enabled: z.boolean(), phone: z.string().optional(), welcomeMessage: z.string().max(300).optional(), position: z.enum(['left', 'right']).optional() }).partial().optional(),
    })
    .passthrough()
    .optional()
    .describe('Sales page content. Objects are merged, lists are replaced.'),
})

/** Produit tel que renvoyé par l'API → forme d'entrée (comme l'éditeur du dashboard). */
function productToInput(p: any) {
  return {
    type: p.type,
    name: p.name,
    isActive: p.isActive,
    description: p.description ?? '',
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currencyPrices: p.currencyPrices ?? [],
    promo: p.promo ?? { type: 'none', value: 0, display: 'strikethrough' },
    offers: p.offers ?? [],
    coverImage: p.coverImage,
    thumbnail: p.thumbnail,
    content: p.content ?? {},
    payment: p.payment && 'method' in p.payment ? p.payment : undefined,
    delivery: p.type === 'digital' ? (p.delivery ?? null) : null,
    externalProductId: p.externalProductId ?? null,
    sku: p.sku,
    trackInventory: p.trackInventory,
    stock: p.stock,
    weightGrams: p.weightGrams,
    variantLabel: p.variantLabel,
    variants: (p.variants ?? []).map((v: any) => ({ id: v.id, name: v.name, sku: v.sku, price: v.price, stock: v.stock, isActive: v.isActive })),
  }
}

function productSummary(p: any, store: { slug: string; subdomain?: string | null }) {
  return { ...p, salesPageUrl: salesPageUrl(store, p.id) }
}

// ─── Outils ──────────────────────────────────────────────────────────────────

export const TOOLS: Tool[] = [
  // Compte & boutiques
  {
    name: 'list_stores',
    title: 'List stores',
    description: 'List the stores this account can access, with the role on each. Start here to get store ids.',
    input: z.object({}),
    readOnly: true,
    run: async (_a, ctx) => {
      const me = await ctx.call<any>('GET', '/auth/me')
      return { user: { name: me.name, email: me.email }, plan: me.plan ?? null, stores: me.stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug, currency: s.currency, status: s.status, role: s.role, storefrontUrl: `https://${s.slug}.${env.BASE_DOMAIN}` })) }
    },
  },
  {
    name: 'get_store',
    title: 'Get store',
    description: 'Store details: name, slug, currency, country, timezone, status, support contacts, domains.',
    input: z.object({ storeId: storeArg }),
    readOnly: true,
    run: async (a, ctx) => {
      const s = await storeInfo(ctx, await resolveStore(ctx, a.storeId))
      return { ...s, storefrontUrl: `https://${s.subdomain || s.slug}.${env.BASE_DOMAIN}` }
    },
  },
  {
    name: 'update_store',
    title: 'Update store',
    description: 'Change store settings: name, currency, country, timezone, support phone/email, subdomain, custom domain.',
    input: z.object({
      storeId: storeArg,
      name: z.string().min(2).max(80).optional(),
      currency: z.string().length(3).optional(),
      locale: z.enum(['fr', 'en']).optional(),
      country: z.string().length(2).optional(),
      timezone: z.string().max(60).optional(),
      supportPhone: z.string().max(25).nullable().optional(),
      supportEmail: z.string().email().nullable().optional(),
      subdomain: z.string().max(60).nullable().optional(),
      customDomain: z.string().max(253).nullable().optional(),
    }),
    run: async ({ storeId, ...patch }, ctx) => ctx.call('PATCH', `/stores/${await resolveStore(ctx, storeId)}`, { body: patch }),
  },
  {
    name: 'pause_store',
    title: 'Pause store',
    description: 'Pause the store: pages stay visible with a message, new orders are refused. Owner only.',
    input: z.object({ storeId: storeArg, message: z.string().max(300).optional().describe('Message shown to visitors') }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/pause`, { body: { message: a.message } }),
  },
  {
    name: 'resume_store',
    title: 'Resume store',
    description: 'Reopen a paused store so it accepts orders again. Owner only.',
    input: z.object({ storeId: storeArg }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/resume`),
  },
  {
    name: 'get_checkout_settings',
    title: 'Get checkout settings',
    description: 'Sales page and order form settings shared by all products: template, layout, colors, button text, trust badges, urgency (countdown, low stock), sticky button, sales popup, order form fields, abandoned cart, pixels.',
    input: z.object({ storeId: storeArg }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/checkout-settings`),
  },
  {
    name: 'update_checkout_settings',
    title: 'Update checkout settings',
    description: 'Change sales page / order form settings. Pass only what changes: objects are merged into the current settings, lists are replaced. Call get_checkout_settings first to see the shape.',
    input: z.object({ storeId: storeArg, patch: z.record(z.string(), z.unknown()).describe('Partial settings, e.g. {"primaryColor":"#16a34a","ctaText":"Commander","urgency":{"countdown":{"enabled":true,"minutes":30}}}') }),
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const cur = await ctx.call<any>('GET', `/stores/${id}/checkout-settings`)
      return ctx.call('PUT', `/stores/${id}/checkout-settings`, { body: deepMerge(cur.settings, a.patch) })
    },
  },
  {
    name: 'update_tracking_pixels',
    title: 'Update tracking pixels',
    description: 'Set the Facebook pixel, Conversions API access token, test event code and TikTok pixel. null removes a value, omitted keeps it.',
    input: z.object({
      storeId: storeArg,
      facebookPixelId: z.string().regex(/^\d{5,20}$/).nullable().optional(),
      facebookAccessToken: z.string().max(500).nullable().optional(),
      facebookTestEventCode: z.string().max(40).nullable().optional(),
      tiktokPixelId: z.string().max(40).nullable().optional(),
    }),
    run: async ({ storeId, ...t }, ctx) => {
      const id = await resolveStore(ctx, storeId)
      const cur = (await ctx.call<any>('GET', `/stores/${id}/checkout-settings`)).tracking
      return ctx.call('PUT', `/stores/${id}/tracking`, {
        body: {
          facebookPixelId: t.facebookPixelId === undefined ? cur.facebookPixelId : t.facebookPixelId,
          facebookTestEventCode: t.facebookTestEventCode === undefined ? cur.facebookTestEventCode : t.facebookTestEventCode,
          tiktokPixelId: t.tiktokPixelId === undefined ? cur.tiktokPixelId : t.tiktokPixelId,
          ...(t.facebookAccessToken !== undefined ? { facebookAccessToken: t.facebookAccessToken } : {}),
        },
      })
    },
  },

  // Produits
  {
    name: 'list_products',
    title: 'List products',
    description: 'All products with price, active state, stock, units sold, revenue and orders waiting for confirmation. Filter by text or active state.',
    input: z.object({ storeId: storeArg, search: z.string().max(100).optional(), active: z.boolean().optional(), type: z.enum(['physical', 'digital']).optional() }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const [store, list] = await Promise.all([storeInfo(ctx, id), ctx.call<any[]>('GET', `/stores/${id}/products`)])
      const q = a.search?.toLowerCase()
      const rows = list.filter((p) => (a.active === undefined || p.isActive === a.active) && (!a.type || p.type === a.type) && (!q || p.name.toLowerCase().includes(q)))
      return { count: rows.length, products: rows.map((p) => productSummary(p, store)) }
    },
  },
  {
    name: 'get_product',
    title: 'Get product',
    description: 'Full product sheet: name, prices, images, description (HTML), headline, features, FAQs, testimonials, bundles, variants, stock, payment method, order form. Use before update_product.',
    input: z.object({ storeId: storeArg, productId: z.string().max(40) }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const [store, p] = await Promise.all([storeInfo(ctx, id), ctx.call<any>('GET', `/stores/${id}/products/${a.productId}`)])
      return productSummary(p, store)
    },
  },
  {
    name: 'create_product',
    title: 'Create product',
    description:
      'Create a product with its full sales page in one call. Image URLs (coverImage, content.gallery) are downloaded and hosted on Zuri. Physical products default to cash on delivery. Set isActive true to put it on sale right away. Returns the product with its sales page URL.',
    input: productFields.extend({ storeId: storeArg, name: z.string().min(2).max(160), price: z.number().min(0) }),
    run: async ({ storeId, ...fields }, ctx) => {
      const id = await resolveStore(ctx, storeId)
      const body: Record<string, any> = deepMerge({ type: 'physical', isActive: false, description: '', content: {} }, fields)
      await rehostProductImages(ctx, id, body)
      const [store, p] = await Promise.all([storeInfo(ctx, id), ctx.call<any>('POST', `/stores/${id}/products`, { body })])
      return productSummary(p, store)
    },
  },
  {
    name: 'update_product',
    title: 'Update product',
    description:
      'Edit any part of a product sheet: pass only the fields to change. Objects (content, promo, payment) are merged, lists (features, faqs, testimonials, gallery, offers, variants) are replaced, so send the full new list. External image URLs are hosted on Zuri automatically.',
    input: productFields.extend({ storeId: storeArg, productId: z.string().max(40) }),
    run: async ({ storeId, productId, ...patch }, ctx) => {
      const id = await resolveStore(ctx, storeId)
      const current = productToInput(await ctx.call<any>('GET', `/stores/${id}/products/${productId}`))
      const body: Record<string, any> = deepMerge(current, patch)
      if (patch.coverImage && !patch.thumbnail) body.thumbnail = null
      await rehostProductImages(ctx, id, body)
      if (!body.thumbnail) body.thumbnail = body.coverImage ?? null
      const [store, p] = await Promise.all([storeInfo(ctx, id), ctx.call<any>('PUT', `/stores/${id}/products/${productId}`, { body })])
      return productSummary(p, store)
    },
  },
  {
    name: 'set_products_active',
    title: 'Activate or deactivate products',
    description: 'Put products on sale (active true) or take them offline (active false), one or many at once.',
    input: z.object({ storeId: storeArg, productIds: z.array(z.string().max(40)).min(1).max(500), active: z.boolean() }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/products/bulk-active`, { body: { ids: a.productIds, isActive: a.active } }),
  },
  {
    name: 'duplicate_product',
    title: 'Duplicate product',
    description: 'Copy a product (sales page, images, variants) as a new inactive product, e.g. to test another angle or price.',
    input: z.object({ storeId: storeArg, productId: z.string().max(40) }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/products/${a.productId}/duplicate`),
  },
  {
    name: 'delete_product',
    title: 'Delete product',
    description: 'Delete a product permanently. Prefer set_products_active false to hide it. Requires confirm: true, ask the user first.',
    input: z.object({ storeId: storeArg, productId: z.string().max(40), confirm: z.literal(true).describe('Must be true, after the user explicitly agreed') }),
    destructive: true,
    run: async (a, ctx) => ctx.call('DELETE', `/stores/${await resolveStore(ctx, a.storeId)}/products/${a.productId}`),
  },
  {
    name: 'import_product_from_url',
    title: 'Import product from a link',
    description:
      'Create a product from any product page link (Shopify, AliExpress, Jumia, Amazon, competitor store…): name, price, description, images, variants, FAQs. Protected sites are read with a real browser; if a site still blocks, pass pageText. Optionally rewrites the sales copy with AI (improveCopy) and activates it. Use preview: true to only look at what would be imported.',
    input: z.object({
      storeId: storeArg,
      url: z.string().url().max(2000),
      pageText: z.string().max(60_000).optional().describe('Text content of the product page, if you already have it (e.g. fetched yourself) or if the site blocks automated reading. Skips fetching.'),
      preview: z.boolean().optional().describe('true = return the extracted draft without creating anything'),
      improveCopy: z.boolean().optional().describe('Rewrite name, headline, description, features and FAQs with AI before saving'),
      goal: z.string().max(300).optional().describe('Angle for the AI copy, e.g. "pour femmes actives à Abidjan, ton chaleureux"'),
      price: z.number().min(0).optional().describe('Override the selling price (store currency)'),
      activate: z.boolean().optional(),
      maxImages: z.number().int().min(0).max(13).optional(),
    }),
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const base = `/stores/${id}/products/import/url`
      const pv = a.pageText ? await ctx.call<any>('POST', `${base}/preview-text`, { body: { text: a.pageText, url: a.url } }) : await ctx.call<any>('POST', `${base}/preview`, { body: { url: a.url } })
      let draft = pv.draft
      if (a.price != null) draft = { ...draft, price: a.price }
      if (a.improveCopy) {
        const s = await ctx.call<any>('POST', `${base}/improve`, { body: { draft, currency: draft.currency ?? null, brand: draft.brand ?? null, goal: a.goal } })
        draft = { ...draft, ...s }
      }
      const images: string[] = (draft.images ?? []).slice(0, a.maxImages ?? 13)
      if (a.preview) return { preview: true, draft: { ...draft, images }, warnings: pv.warnings ?? [] }
      if (draft.price == null) throw new ToolError('No price found on that page: pass price.')
      const storeCurrency = (await storeInfo(ctx, id)).currency
      if (a.price == null && draft.currency && draft.currency !== storeCurrency) {
        throw new ToolError(`The source page price is in ${draft.currency} but the store sells in ${storeCurrency}: pass price (in ${storeCurrency}).`)
      }
      const { images: _i, ...rest } = draft
      const r = await ctx.call<any>('POST', `${base}/commit`, { body: { draft: { ...rest, faqs: rest.faqs ?? [], testimonials: rest.testimonials ?? [], features: rest.features ?? [], variants: rest.variants ?? [] }, imageUrls: images, activate: a.activate ?? false, sourceUrl: a.url } })
      const [store, p] = await Promise.all([storeInfo(ctx, id), ctx.call<any>('GET', `/stores/${id}/products/${r.id}`)])
      return { ...productSummary(p, store), warnings: r.warnings }
    },
  },
  {
    name: 'suggest_product_copy',
    title: 'Suggest product copy with AI',
    description: 'Zuri AI proposes a better name, headline, tagline, description, features and FAQs for an existing product. Set apply: true to save them directly.',
    input: z.object({ storeId: storeArg, productId: z.string().max(40), goal: z.string().max(300).optional(), apply: z.boolean().optional() }),
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const p = await ctx.call<any>('GET', `/stores/${id}/products/${a.productId}`)
      const store = await storeInfo(ctx, id)
      const s = await ctx.call<any>('POST', `/stores/${id}/products/import/url/improve`, {
        body: { draft: { name: p.name, description: p.description ?? '', price: p.price, features: p.content?.features ?? [], variants: (p.variants ?? []).map((v: any) => ({ name: v.name })) }, currency: store.currency, goal: a.goal },
      })
      if (!a.apply) return { suggestion: s }
      const body = deepMerge(productToInput(p), { name: s.name, description: s.description, content: { kicker: s.kicker, headline: s.headline, tagline: s.tagline, features: s.features, faqs: s.faqs } })
      return productSummary(await ctx.call('PUT', `/stores/${id}/products/${a.productId}`, { body }), store)
    },
  },
  {
    name: 'upload_image_from_url',
    title: 'Host an image on Zuri',
    description: 'Download an image from a public URL and host it on the Zuri CDN (WebP, resized). Returns the hosted URL, usable in descriptions or product images.',
    input: z.object({ storeId: storeArg, url: z.string().url().max(2000), preset: z.enum(['cover', 'thumbnail', 'content', 'gallery']).optional() }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/uploads/image-url`, { body: { url: a.url, preset: a.preset ?? 'content' } }),
  },

  // Commandes
  {
    name: 'list_orders',
    title: 'List orders',
    description:
      'Search orders. Filter by status (new = to call, unreachable, confirmed, shipped, delivered, returned, cancelled), payment status, product type, dates, assignee or text (number, name, phone, city). Returns counts per status too.',
    input: z.object({
      storeId: storeArg,
      status: z.enum(['new', 'confirmed', 'unreachable', 'shipped', 'delivered', 'returned', 'cancelled']).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
      type: z.enum(['physical', 'digital']).optional(),
      search: z.string().max(100).optional(),
      period: periodArg,
      from: ymd.optional(),
      to: ymd.optional(),
      assigned: z.union([z.enum(['me', 'none']), z.number().int().positive()]).optional().describe('me, none (unassigned) or a team member user id'),
      archived: z.enum(['only', 'all']).optional(),
      page: z.number().int().min(1).optional(),
      pageSize: z.number().int().min(1).max(200).optional(),
    }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const range = a.period || a.from || a.to ? await rangeFor(ctx, id, a) : null
      const r = await ctx.call<any>('GET', `/stores/${id}/orders`, {
        query: { fulfillmentStatus: a.status, paymentStatus: a.paymentStatus, type: a.type, q: a.search, from: range?.from, to: range?.to, assigned: a.assigned, archived: a.archived, page: a.page, pageSize: a.pageSize ?? 50 },
      })
      return { total: r.total, page: r.page, pageSize: r.pageSize, statusCounts: r.statusCounts, range, orders: r.data.map(orderRow) }
    },
  },
  {
    name: 'get_order',
    title: 'Get order',
    description: 'Full order: customer, address, items, amounts, payment, status history, notes, call attempts, assignee, allowed next statuses.',
    input: z.object({ storeId: storeArg, orderId: z.string().max(40) }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/orders/${a.orderId}`),
  },
  {
    name: 'update_order_status',
    title: 'Update order status',
    description:
      'Move one or many orders to a new status: confirmed, unreachable, shipped (add courier and trackingNumber), delivered (cash on delivery counted as collected), returned, cancelled. Only allowed transitions pass (see get_order allowedTransitions).',
    input: z.object({
      storeId: storeArg,
      orderIds: z.array(z.string().max(40)).min(1).max(200),
      status: z.enum(['new', 'confirmed', 'unreachable', 'shipped', 'delivered', 'returned', 'cancelled']),
      note: z.string().max(1000).optional(),
      courier: z.string().max(80).optional(),
      trackingNumber: z.string().max(80).optional(),
    }),
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const body = strip({ fulfillmentStatus: a.status, note: a.note, courier: a.courier, trackingNumber: a.trackingNumber })
      if (a.orderIds.length === 1) return ctx.call('POST', `/stores/${id}/orders/${a.orderIds[0]}/status`, { body })
      return ctx.call('POST', `/stores/${id}/orders/bulk-status`, { body: { ...body, ids: a.orderIds } })
    },
  },
  {
    name: 'update_order',
    title: 'Edit order details',
    description: 'Correct customer name, phone, city, address, courier or tracking number on an order.',
    input: z.object({
      storeId: storeArg,
      orderId: z.string().max(40),
      customerName: z.string().max(120).optional(),
      customerPhone: z.string().max(30).optional(),
      city: z.string().max(120).nullable().optional(),
      address: z.string().max(500).nullable().optional(),
      courier: z.string().max(80).nullable().optional(),
      trackingNumber: z.string().max(80).nullable().optional(),
    }),
    run: async ({ storeId, orderId, ...patch }, ctx) => ctx.call('PATCH', `/stores/${await resolveStore(ctx, storeId)}/orders/${orderId}`, { body: patch }),
  },
  {
    name: 'update_order_payment',
    title: 'Update order payment',
    description: 'Set the payment status of an order (pending, paid, failed, refunded), e.g. after a Mobile Money transfer received by hand.',
    input: z.object({ storeId: storeArg, orderId: z.string().max(40), paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']), note: z.string().max(1000).optional() }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/orders/${a.orderId}/payment`, { body: strip({ paymentStatus: a.paymentStatus, note: a.note }) }),
  },
  {
    name: 'add_order_note',
    title: 'Add order note',
    description: 'Add an internal note to an order history (e.g. "client rappelle demain 10h").',
    input: z.object({ storeId: storeArg, orderId: z.string().max(40), note: z.string().min(1).max(2000) }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/orders/${a.orderId}/notes`, { body: { note: a.note } }),
  },
  {
    name: 'assign_order',
    title: 'Assign order',
    description: 'Give an order to a team member (closer) by user id, or null to free it. See list_team for ids.',
    input: z.object({ storeId: storeArg, orderId: z.string().max(40), userId: z.number().int().positive().nullable() }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/orders/${a.orderId}/assign`, { body: { userId: a.userId } }),
  },
  {
    name: 'archive_orders',
    title: 'Archive orders',
    description: 'Archive (hide from the default list) or unarchive orders.',
    input: z.object({ storeId: storeArg, orderIds: z.array(z.string().max(40)).min(1).max(500), archived: z.boolean() }),
    run: async (a, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, a.storeId)}/orders/archive`, { body: { ids: a.orderIds, archived: a.archived } }),
  },
  {
    name: 'create_order',
    title: 'Create order',
    description: 'Record an order received outside the sales page (WhatsApp, phone, shop). Prices default to the product prices.',
    input: z.object({
      storeId: storeArg,
      items: z.array(z.object({ productId: z.string().max(40), variantId: z.number().int().positive().nullable().optional(), quantity: z.number().int().min(1).max(500), unitPrice: z.number().min(0).optional() })).min(1),
      customerName: z.string().min(2).max(120),
      customerPhone: z.string().min(6).max(25),
      customerEmail: z.string().email().nullable().optional(),
      city: z.string().max(120).nullable().optional(),
      address: z.string().max(500).nullable().optional(),
      deliveryZoneId: z.number().int().positive().nullable().optional(),
      shippingFee: z.number().min(0).optional(),
      paymentMethod: z.enum(['cod', 'mobile_money', 'external', 'manual']).optional(),
      note: z.string().max(1000).nullable().optional(),
    }),
    run: async ({ storeId, ...body }, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, storeId)}/orders`, { body }),
  },

  // Ventes & statistiques
  {
    name: 'get_sales_summary',
    title: 'Sales summary',
    description:
      'Sales recap for a period (default last 30 days) compared with the previous period of the same length: orders, revenue collected, cash on delivery to confirm / to ship / with couriers, confirmation, delivery and conversion rates, visitors, top products, traffic sources, daily series.',
    input: z.object({ storeId: storeArg, period: periodArg, from: ymd.optional(), to: ymd.optional() }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const range = await rangeFor(ctx, id, a)
      const r = await ctx.call<any>('GET', `/stores/${id}/stats/overview`, { query: range })
      const c = r.current
      const p = r.previous
      return {
        period: range,
        currency: r.currency,
        revenueVisible: r.revenueVisible,
        current: c,
        previous: p,
        change: { ordersPct: pct(c.orders, p.orders), revenuePct: pct(c.revenue, p.revenue), deliveredPct: pct(c.delivered, p.delivered) },
        rates: r.rates,
        visitors: r.visitors,
        topProducts: r.topProducts,
        sources: r.sources,
        daily: r.daily,
        myResults: r.mine,
      }
    },
  },
  {
    name: 'get_sales_report',
    title: 'Sales report',
    description:
      'Detailed sales report for any period: series by day, week or month, with an optional breakdown by product, city, traffic source, ad campaign, status, closer (assignee) or payment method. Each row has orders, confirmed, delivered, returned, cancelled, pending, revenue collected, revenue booked, confirmation and delivery rates.',
    input: z.object({
      storeId: storeArg,
      period: periodArg,
      from: ymd.optional(),
      to: ymd.optional(),
      groupBy: z.enum(['day', 'week', 'month']).optional(),
      breakdown: z.enum(['none', 'product', 'city', 'source', 'campaign', 'status', 'assignee', 'payment_method']).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const range = await rangeFor(ctx, id, a)
      return ctx.call('GET', `/stores/${id}/stats/report`, { query: { ...range, groupBy: a.groupBy, breakdown: a.breakdown, limit: a.limit } })
    },
  },
  {
    name: 'compare_periods',
    title: 'Compare two periods',
    description: 'Compare two periods side by side (e.g. this month vs last month, or two custom ranges): totals, rates and changes in %, optionally per product, city, source or closer.',
    input: z.object({
      storeId: storeArg,
      periodA: periodArg,
      fromA: ymd.optional(),
      toA: ymd.optional(),
      periodB: periodArg,
      fromB: ymd.optional(),
      toB: ymd.optional(),
      breakdown: z.enum(['none', 'product', 'city', 'source', 'campaign', 'assignee', 'payment_method']).optional(),
    }),
    readOnly: true,
    run: async (a, ctx) => {
      const id = await resolveStore(ctx, a.storeId)
      const ra = await rangeFor(ctx, id, { period: a.periodA ?? 'this_month', from: a.fromA, to: a.toA })
      const rb = await rangeFor(ctx, id, { period: a.periodB ?? 'last_month', from: a.fromB, to: a.toB })
      const q = (r: { from: string; to: string }) => ctx.call<any>('GET', `/stores/${id}/stats/report`, { query: { ...r, groupBy: 'month', breakdown: a.breakdown ?? 'none', limit: 50 } })
      const [A, B] = await Promise.all([q(ra), q(rb)])
      const keys = ['orders', 'confirmed', 'delivered', 'returned', 'cancelled', 'revenueCollected', 'revenueBooked', 'confirmationRate', 'deliveryRate'] as const
      const change = Object.fromEntries(keys.map((k) => [k, pct(A.totals[k], B.totals[k])]))
      let breakdown = null
      if (A.breakdown) {
        const byKey = new Map<string, any>((B.breakdown?.rows ?? []).map((r: any) => [String(r.key), r]))
        breakdown = A.breakdown.rows.map((r: any) => {
          const b = byKey.get(String(r.key))
          return { key: r.key, label: r.label, a: r, b: b ?? null, ordersPct: pct(r.orders, b?.orders ?? 0), revenuePct: pct(r.revenueCollected, b?.revenueCollected ?? 0) }
        })
      }
      return { currency: A.currency, a: { range: ra, totals: A.totals }, b: { range: rb, totals: B.totals }, changePct: change, breakdown }
    },
  },

  // Clients
  {
    name: 'list_customers',
    title: 'List customers',
    description: 'Customers with their number of orders, spend and returns. Search by name, phone or email.',
    input: z.object({ storeId: storeArg, search: z.string().max(100).optional(), page: z.number().int().min(1).optional() }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/customers`, { query: { q: a.search, page: a.page } }),
  },
  {
    name: 'get_customer',
    title: 'Get customer',
    description: 'Customer details and order history.',
    input: z.object({ storeId: storeArg, customerId: z.string().max(40) }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/customers/${a.customerId}`),
  },
  {
    name: 'update_customer',
    title: 'Update customer',
    description: 'Rename a customer, add notes, or block them (blocked customers are flagged on new orders).',
    input: z.object({ storeId: storeArg, customerId: z.string().max(40), name: z.string().max(120).optional(), notes: z.string().max(2000).nullable().optional(), isBlocked: z.boolean().optional() }),
    run: async ({ storeId, customerId, ...patch }, ctx) => ctx.call('PATCH', `/stores/${await resolveStore(ctx, storeId)}/customers/${customerId}`, { body: patch }),
  },

  // Codes promo
  {
    name: 'list_promo_codes',
    title: 'List promo codes',
    description: 'Promo codes with type, value, usage, limits and dates.',
    input: z.object({ storeId: storeArg }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/promo-codes`),
  },
  {
    name: 'create_promo_code',
    title: 'Create promo code',
    description: 'Create a promo code: percentage or fixed amount, optional max uses, minimum basket, products and dates.',
    input: z.object({
      storeId: storeArg,
      code: z.string().regex(/^[A-Za-z0-9_-]{3,30}$/),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().min(0),
      maxUses: z.number().int().min(1).nullable().optional(),
      minSubtotal: z.number().min(0).nullable().optional(),
      productIds: z.array(z.string().max(40)).optional().describe('Empty = all products'),
      startsAt: z.string().nullable().optional().describe('ISO date'),
      endsAt: z.string().nullable().optional().describe('ISO date'),
      isActive: z.boolean().optional(),
    }),
    run: async ({ storeId, ...body }, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, storeId)}/promo-codes`, { body }),
  },
  {
    name: 'update_promo_code',
    title: 'Update promo code',
    description: 'Change a promo code (only the fields given), e.g. deactivate it or extend its end date.',
    input: z.object({
      storeId: storeArg,
      promoCodeId: z.number().int().positive(),
      code: z.string().regex(/^[A-Za-z0-9_-]{3,30}$/).optional(),
      type: z.enum(['percentage', 'fixed']).optional(),
      value: z.number().min(0).optional(),
      maxUses: z.number().int().min(1).nullable().optional(),
      minSubtotal: z.number().min(0).nullable().optional(),
      productIds: z.array(z.string().max(40)).optional(),
      startsAt: z.string().nullable().optional(),
      endsAt: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
    run: async ({ storeId, promoCodeId, ...patch }, ctx) => {
      const id = await resolveStore(ctx, storeId)
      const list = await ctx.call<any[]>('GET', `/stores/${id}/promo-codes`)
      const cur = list.find((p) => p.id === promoCodeId)
      if (!cur) throw new ToolError('Promo code not found')
      const body = { code: cur.code, type: cur.type, value: cur.value, maxUses: cur.maxUses, minSubtotal: cur.minSubtotal, productIds: cur.productIds ?? [], startsAt: cur.startsAt, endsAt: cur.endsAt, isActive: cur.isActive, ...strip(patch), ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v === null)) }
      return ctx.call('PUT', `/stores/${id}/promo-codes/${promoCodeId}`, { body })
    },
  },
  {
    name: 'delete_promo_code',
    title: 'Delete promo code',
    description: 'Delete a promo code. Requires confirm: true.',
    input: z.object({ storeId: storeArg, promoCodeId: z.number().int().positive(), confirm: z.literal(true) }),
    destructive: true,
    run: async (a, ctx) => ctx.call('DELETE', `/stores/${await resolveStore(ctx, a.storeId)}/promo-codes/${a.promoCodeId}`),
  },

  // Livraison
  {
    name: 'list_delivery_zones',
    title: 'List delivery zones',
    description: 'Delivery zones with cities, fee, free shipping threshold, cash on delivery allowed, delay label.',
    input: z.object({ storeId: storeArg }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/zones`),
  },
  {
    name: 'create_delivery_zone',
    title: 'Create delivery zone',
    description: 'Add a delivery zone, e.g. "Abidjan" with cities Cocody, Yopougon… fee 1500, free above 30000.',
    input: z.object({
      storeId: storeArg,
      name: z.string().min(2).max(80),
      country: z.string().length(2),
      cities: z.array(z.string().max(80)).max(200).optional(),
      fee: z.number().min(0),
      freeAbove: z.number().min(0).nullable().optional(),
      codAllowed: z.boolean().optional(),
      etaLabel: z.string().max(60).nullable().optional().describe('e.g. "Livré en 24 h"'),
      isActive: z.boolean().optional(),
    }),
    run: async ({ storeId, ...body }, ctx) => ctx.call('POST', `/stores/${await resolveStore(ctx, storeId)}/zones`, { body }),
  },
  {
    name: 'update_delivery_zone',
    title: 'Update delivery zone',
    description: 'Change a delivery zone (only the fields given). cities replaces the whole list.',
    input: z.object({
      storeId: storeArg,
      zoneId: z.number().int().positive(),
      name: z.string().min(2).max(80).optional(),
      country: z.string().length(2).optional(),
      cities: z.array(z.string().max(80)).max(200).optional(),
      fee: z.number().min(0).optional(),
      freeAbove: z.number().min(0).nullable().optional(),
      codAllowed: z.boolean().optional(),
      etaLabel: z.string().max(60).nullable().optional(),
      isActive: z.boolean().optional(),
    }),
    run: async ({ storeId, zoneId, ...patch }, ctx) => {
      const id = await resolveStore(ctx, storeId)
      const cur = (await ctx.call<any[]>('GET', `/stores/${id}/zones`)).find((z) => z.id === zoneId)
      if (!cur) throw new ToolError('Delivery zone not found')
      const base = { name: cur.name, country: cur.country, cities: cur.cities, fee: cur.fee, freeAbove: cur.freeAbove, codAllowed: cur.codAllowed, etaLabel: cur.etaLabel, isActive: cur.isActive, position: cur.position }
      return ctx.call('PUT', `/stores/${id}/zones/${zoneId}`, { body: { ...base, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) } })
    },
  },
  {
    name: 'delete_delivery_zone',
    title: 'Delete delivery zone',
    description: 'Delete a delivery zone. Requires confirm: true.',
    input: z.object({ storeId: storeArg, zoneId: z.number().int().positive(), confirm: z.literal(true) }),
    destructive: true,
    run: async (a, ctx) => ctx.call('DELETE', `/stores/${await resolveStore(ctx, a.storeId)}/zones/${a.zoneId}`),
  },

  // Équipe & activité
  {
    name: 'list_team',
    title: 'List team',
    description: 'Team members (role, product access, open orders) and pending invitations.',
    input: z.object({ storeId: storeArg }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/team`),
  },
  {
    name: 'invite_team_member',
    title: 'Invite team member',
    description: 'Invite someone by email. Roles: admin, store_manager, order_manager, closer. productIds limits access to some products (null = all). options.viewRevenue / exportData.',
    input: z.object({
      storeId: storeArg,
      email: z.string().email(),
      role: z.enum(['admin', 'store_manager', 'order_manager', 'closer']),
      productIds: z.array(z.string().max(40)).nullable().optional(),
      options: z.object({ viewRevenue: z.boolean(), exportData: z.boolean() }).partial().optional(),
    }),
    run: async ({ storeId, ...b }, ctx) =>
      ctx.call('POST', `/stores/${await resolveStore(ctx, storeId)}/team/invitations`, { body: { email: b.email, role: b.role, productIds: b.productIds ?? null, options: { viewRevenue: false, exportData: false, ...b.options } } }),
  },
  {
    name: 'update_team_member',
    title: 'Update team member',
    description: 'Change a member role, product access or options.',
    input: z.object({
      storeId: storeArg,
      userId: z.number().int().positive(),
      role: z.enum(['admin', 'store_manager', 'order_manager', 'closer']),
      productIds: z.array(z.string().max(40)).nullable().optional(),
      options: z.object({ viewRevenue: z.boolean(), exportData: z.boolean() }).partial().optional(),
    }),
    run: async ({ storeId, userId, ...b }, ctx) =>
      ctx.call('PATCH', `/stores/${await resolveStore(ctx, storeId)}/team/members/${userId}`, { body: { role: b.role, productIds: b.productIds ?? null, options: { viewRevenue: false, exportData: false, ...b.options } } }),
  },
  {
    name: 'remove_team_member',
    title: 'Remove team member',
    description: 'Remove a member from the store (their open orders are freed). Requires confirm: true.',
    input: z.object({ storeId: storeArg, userId: z.number().int().positive(), confirm: z.literal(true) }),
    destructive: true,
    run: async (a, ctx) => ctx.call('DELETE', `/stores/${await resolveStore(ctx, a.storeId)}/team/members/${a.userId}`),
  },
  {
    name: 'list_activity',
    title: 'Activity feed',
    description: 'Recent activity: order status changes, product edits, team actions, with who did it (actions made through the API are tagged).',
    input: z.object({ storeId: storeArg, page: z.number().int().min(1).optional(), userId: z.number().int().positive().optional(), entityType: z.string().max(30).optional() }),
    readOnly: true,
    run: async (a, ctx) => ctx.call('GET', `/stores/${await resolveStore(ctx, a.storeId)}/activity`, { query: { page: a.page, userId: a.userId, entityType: a.entityType } }),
  },
]

export const SERVER_INSTRUCTIONS = `Zuri is an online store platform built for Africa: cash on delivery (COD), Mobile Money, closer teams who confirm orders by phone, delivery tracking.

How to work with it:
- Start with list_stores. Pass storeId when the account has several stores.
- Amounts are in the store currency (often XOF / FCFA, no decimals).
- Order lifecycle for COD: new (to call) -> confirmed or unreachable -> shipped -> delivered (cash collected) or returned; cancelled before shipping.
- "Revenue collected" = paid online or COD delivered. "Revenue booked" = ordered, excluding cancelled and returned.
- Product sheets: get_product then update_product with only the fields to change; lists are replaced, objects merged. Image URLs are hosted on Zuri automatically.
- Write customer facing copy in the store language (usually French), concrete and honest: no invented reviews, numbers or medical claims.
- Destructive tools need confirm: true: always ask the user first.
- You only see and can change what the user's role allows (some members do not see amounts or all products).`
