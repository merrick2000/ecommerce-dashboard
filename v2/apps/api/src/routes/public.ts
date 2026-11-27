/**
 * API publique consommée par le storefront (/api/v1). Aucune authentification :
 * chaque route ne renvoie que ce qu'un visiteur a le droit de voir.
 */
import { funnelAnswerSchema, NATIVE_PROVIDERS, parseOrderForm, productIdSchema, publicOrderCreateSchema, storeIdSchema } from '@zuri/shared'
import { and, asc, desc, eq, gte, inArray, isNull, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { checkoutSettings, deliveryZones, downloads, leads, orderItems, orders, pageEvents, paymentAccounts, productVariants, products, promoCodes, stores } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { sha256 } from '../lib/crypto'
import { env } from '../lib/env'
import { badRequest, HttpError, notFound } from '../lib/errors'
import { clientIp, rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { answerFunnelOffer, createPublicOrder, normalizePhone } from '../services/orders'
import { arrivalEvent } from '../jobs/handlers'
import { enqueue } from '../jobs/queue'
import { poAccount } from '../services/po'
import { storeCartAllowed, storeOnlinePayments } from '../services/platform'
import { displayPrice, evaluatePromoCode } from '../services/pricing'
import { publicUrl, signedUrl } from '../services/storage'
import { storeCatalog } from '../services/catalog-feed'
import { checkPreviewToken } from '../services/preview'
import { DEFAULT_CHECKOUT, withCheckoutDefaults } from './stores'

/**
 * Position approximative transmise par le relais de la boutique (Cloudflare connaît la ville de chaque visiteur).
 * Coordonnées arrondies à 2 décimales (~1 km) : assez pour le globe, jamais une adresse.
 */
function geoOf(header: (name: string) => string | undefined) {
  const text = (n: string) => {
    const raw = header(n)
    if (!raw) return null
    try {
      return decodeURIComponent(raw).trim().slice(0, 120) || null
    } catch {
      return null
    }
  }
  const coord = (n: string, max: number) => {
    const x = Number(header(n))
    return header(n) && Number.isFinite(x) && Math.abs(x) <= max ? Math.round(x * 100) / 100 : null
  }
  const lat = coord('x-geo-lat', 90)
  const lon = coord('x-geo-lon', 180)
  return { city: text('x-geo-city'), region: text('x-geo-region'), lat: lat !== null && lon !== null ? lat : null, lon: lat !== null && lon !== null ? lon : null }
}

const EVENT_TYPES = [
  'page_view', 'page_leave', 'scroll_25', 'scroll_50', 'scroll_75', 'scroll_100', 'cta_click', 'form_focus',
  'checkout_initiate', 'order_created', 'payment_started', 'payment_completed', 'js_error', 'video_play', 'whatsapp_click', 'offer_select',
] as const
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i

async function storeBySlug(slug: string) {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1)
  if (!store) throw notFound('Boutique')
  if (store.closedAt) throw new HttpError(410, 'Cette boutique est fermée', 'store_closed')
  return store
}

/** Adresse officielle d'une boutique (une seule URL par contenu) : domaine perso vérifié, sinon son sous-domaine. */
const canonicalHost = (s: typeof stores.$inferSelect) => (s.customDomain && s.customDomainVerifiedAt ? s.customDomain : `${s.subdomain || s.slug}.${env.BASE_DOMAIN ?? 'zurisell.store'}`)
const publicStore = (s: typeof stores.$inferSelect) => ({ id: s.id, status: s.status, pauseMessage: s.pauseMessage, name: s.name, slug: s.slug, currency: s.currency, locale: s.locale, country: s.country, supportPhone: s.supportPhone, supportEmail: s.supportEmail, canonicalHost: canonicalHost(s) })

/**
 * Données publiques des liens d'un produit : contenu du pack et offres du tunnel
 * (nom, image, prix normal pour afficher l'économie). Rien d'autre ne sort (ni coût, ni stock exact).
 */
async function publicLinks(store: typeof stores.$inferSelect, product: typeof products.$inferSelect) {
  const bundleItems = product.bundle?.items ?? []
  const f = product.funnel
  const offers = f ? [f.bump, ...f.upsells.flatMap((u) => [u, u.downsell])].filter((o): o is NonNullable<typeof o> => !!o) : []
  const ids = [...new Set([...bundleItems.map((i) => i.productId), ...offers.map((o) => o.productId)])]
  if (!ids.length) return { bundle: null, funnel: null }
  const rows = await db.select().from(products).where(and(eq(products.storeId, store.id), inArray(products.id, ids)))
  const vIds = [...bundleItems, ...offers].map((x) => x.variantId).filter((v): v is number => typeof v === 'number')
  const vars = vIds.length ? await db.select().from(productVariants).where(inArray(productVariants.id, vIds)) : []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const stockOk = (p: typeof products.$inferSelect, variantId: number | null, need: number) => {
    if (p.type !== 'physical' || !p.trackInventory) return true
    const v = variantId ? vars.find((x) => x.id === variantId) : null
    const stock = v ? v.stock : p.stock
    return stock == null || stock >= need
  }
  const bundle = bundleItems.length
    ? {
        items: bundleItems
          .map((i) => {
            const p = byId.get(i.productId)
            if (!p) return null
            const v = i.variantId ? vars.find((x) => x.id === i.variantId) : null
            return { productId: p.id, name: v ? `${p.name} (${v.name})` : p.name, quantity: i.quantity, image: publicUrl(p.thumbnail ?? p.coverImage), price: displayPrice(p, store.currency, v ?? null).effective }
          })
          .filter((x): x is NonNullable<typeof x> => !!x),
        inStock: bundleItems.every((i) => {
          const p = byId.get(i.productId)
          return !!p && stockOk(p, i.variantId, i.quantity)
        }),
      }
    : null
  const pub = (o: NonNullable<(typeof offers)[number]>) => {
    const p = byId.get(o.productId)
    if (!p || !stockOk(p, o.variantId, 1)) return null
    const v = o.variantId ? vars.find((x) => x.id === o.variantId) : null
    const regular = displayPrice(p, store.currency, v ?? null).effective
    return { id: o.id, title: o.title, text: o.text, price: o.price, regularPrice: regular > o.price ? regular : null, productName: v ? `${p.name} (${v.name})` : p.name, image: publicUrl(o.image ?? p.thumbnail ?? p.coverImage), acceptLabel: o.acceptLabel || null, declineLabel: o.declineLabel || null }
  }
  const funnel = f
    ? {
        bump: f.bump ? pub(f.bump) : null,
        upsells: f.upsells.map((u) => ({ ...pub(u), downsell: u.downsell ? pub(u.downsell) : null })).filter((u) => u.id),
        thankYou: f.thankYou,
      }
    : null
  return { bundle, funnel }
}

export const publicRoutes = new Hono<AppEnv>()
  /** Résolution sous-domaine / domaine perso → slug (appelé par le Worker/middleware). */
  .get('/stores/resolve', v('query', z.object({ host: z.string().max(255) })), async (c) => {
    const host = c.req.valid('query').host.toLowerCase().split(':')[0]!
    const suffix = `.${env.BASE_DOMAIN}`
    const [store] = host.endsWith(suffix)
      ? await db.select({ slug: stores.slug }).from(stores).where(eq(stores.subdomain, host.slice(0, -suffix.length))).limit(1)
      : await db
          .select({ slug: stores.slug })
          .from(stores)
          .where(and(eq(stores.customDomain, host), dsql`${stores.customDomainVerifiedAt} is not null`))
          .limit(1)
    c.header('Cache-Control', 'public, max-age=300')
    if (!store) return c.json({ slug: null }, 404)
    return c.json({ slug: store.slug })
  })
  /** Catalogue normalisé (flux Google Merchant / Meta, format Shopify, données structurées) : produits actifs. */
  .get('/stores/:slug/catalog', async (c) => {
    const store = await storeBySlug(c.req.param('slug'))
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=900')
    return c.json({ store: publicStore(store), items: store.status === 'active' ? await storeCatalog(store) : [] })
  })
  .get('/stores/:slug', async (c) => {
    const store = await storeBySlug(c.req.param('slug'))
    const rows = await db.select().from(products).where(and(eq(products.storeId, store.id), eq(products.isActive, true))).orderBy(desc(products.createdAt))
    const [cfg] = await db.select({ settings: checkoutSettings.settings }).from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1)
    // Produits à variantes : on passe par leur page pour choisir (taille, couleur…) avant d'ajouter au panier.
    const withVariants = rows.length
      ? new Set((await db.select({ id: productVariants.productId }).from(productVariants).where(and(inArray(productVariants.productId, rows.map((r) => r.id)), eq(productVariants.isActive, true)))).map((v) => v.id))
      : new Set<string>()
    c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return c.json({
      store: publicStore(store),
      primaryColor: cfg?.settings.primaryColor ?? DEFAULT_CHECKOUT.primaryColor,
      cartEnabled: Boolean(cfg?.settings.cart?.enabled) && (await storeCartAllowed(store.id)),
      products: rows.map((p) => ({ id: p.id, type: p.type, name: p.name, category: p.category, hasVariants: withVariants.has(p.id), paymentMethod: p.payment.method, thumbnail: publicUrl(p.thumbnail ?? p.coverImage), price: displayPrice(p, store.currency) })),
    })
  })
  /** Panier : lignes recalculées avec les prix et la disponibilité réels (le navigateur ne garde que les identifiants). */
  .post(
    '/cart/lines',
    rateLimit({ key: 'cart', limit: 60, windowSec: 300 }),
    v('json', z.object({ storeSlug: z.string().max(60), items: z.array(z.object({ productId: productIdSchema, variantId: z.coerce.number().int().positive().nullable().optional(), quantity: z.coerce.number().int().min(1).max(50).default(1) })).max(20) })),
    async (c) => {
      const { storeSlug, items } = c.req.valid('json')
      const store = await storeBySlug(storeSlug)
      const ids = [...new Set(items.map((i) => i.productId))]
      const rows = ids.length ? await db.select().from(products).where(and(inArray(products.id, ids), eq(products.storeId, store.id))) : []
      const vids = items.map((i) => i.variantId).filter((x): x is number => !!x)
      const vrows = vids.length ? await db.select().from(productVariants).where(inArray(productVariants.id, vids)) : []
      return c.json(
        items.map((i) => {
          const p = rows.find((r) => r.id === i.productId)
          const v = i.variantId ? vrows.find((x) => x.id === i.variantId && x.productId === i.productId) : undefined
          const available = Boolean(p?.isActive && (!i.variantId || v?.isActive))
          if (!p) return { productId: i.productId, variantId: i.variantId ?? null, available: false }
          const price = displayPrice(p, store.currency, v ?? null)
          const quantity = p.type === 'physical' ? i.quantity : 1
          return {
            productId: p.id,
            variantId: v?.id ?? null,
            name: p.name,
            variantName: v?.name ?? null,
            image: publicUrl(p.thumbnail ?? p.coverImage),
            type: p.type,
            paymentMethod: p.payment.method,
            unitPrice: price.effective,
            quantity,
            total: Math.round(price.effective * quantity * 100) / 100,
            currency: price.currency,
            available,
          }
        }),
      )
    },
  )
  /** Tout ce qu'il faut pour afficher une page de vente. */
  .get('/checkout/:slug/:productId', v('param', z.object({ slug: z.string(), productId: z.string().max(40) })), async (c) => {
    const { slug, productId } = c.req.valid('param')
    const store = await storeBySlug(slug)
    // Ancien lien numérique (/p/123, pubs de Sellit v1) : on retrouve le produit par son ancien numéro.
    // Le storefront voit que product.id diffère de l'URL et redirige (301) vers la nouvelle adresse.
    const byId = /^\d{1,10}$/.test(productId) ? eq(products.legacyId, Number(productId)) : eq(products.id, productId)
    // Aperçu depuis le tableau de bord (jeton signé) : produit visible même s'il n'est pas en vente.
    const preview = checkPreviewToken(productId, c.req.query('preview'))
    const [product] = await db.select().from(products).where(and(byId, eq(products.storeId, store.id), preview ? undefined : eq(products.isActive, true))).limit(1)
    if (!product) throw notFound('Produit')
    const [cfg, variants, zones, providers] = await Promise.all([
      db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1).then((r) => r[0]),
      product.type === 'physical' ? db.select().from(productVariants).where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true))).orderBy(asc(productVariants.position)) : [],
      product.type === 'physical'
        ? db
            .select({ id: deliveryZones.id, name: deliveryZones.name, country: deliveryZones.country, cities: deliveryZones.cities, fee: deliveryZones.fee, freeAbove: deliveryZones.freeAbove, codAllowed: deliveryZones.codAllowed, etaLabel: deliveryZones.etaLabel })
            .from(deliveryZones)
            .where(and(eq(deliveryZones.storeId, store.id), eq(deliveryZones.isActive, true)))
            .orderBy(asc(deliveryZones.position))
        : [],
      db.select({ provider: paymentAccounts.provider }).from(paymentAccounts).where(and(eq(paymentAccounts.storeId, store.id), eq(paymentAccounts.enabled, true))),
    ])
    // Payment Orchestrator (compte de la boutique, ou de la plateforme pour le super admin) : passe avant les autres moyens.
    const poAcc = product.payment.method === 'native' ? await poAccount(store.id) : null
    const onlinePaymentEnabled = Boolean(poAcc) || (providers.some((p) => (NATIVE_PROVIDERS as readonly string[]).includes(p.provider)) && (await storeOnlinePayments(store.id)))
    const { bundle, funnel } = await publicLinks(store, product)
    c.header('Cache-Control', preview ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=120')
    return c.json({
      store: publicStore(store),
      preview,
      product: {
        id: product.id,
        type: product.type,
        name: product.name,
        /** Référence (SKU, sinon identifiant) : données structurées et catalogues. */
        sku: product.sku || product.id,
        updatedAt: product.updatedAt,
        isActive: product.isActive,
        description: product.description,
        coverImage: publicUrl(product.coverImage),
        thumbnail: publicUrl(product.thumbnail),
        price: displayPrice(product, store.currency),
        promo: product.promo,
        compareAtPrice: product.compareAtPrice,
        offers: product.offers,
        content: {
          ...product.content,
          gallery: product.content.gallery.map((g) => publicUrl(g)),
          // Page libre : seule la version nettoyée sort (jamais le HTML d'origine du vendeur).
          customPage: product.content.customPage?.enabled ? { enabled: true, html: product.content.customPage.html, css: product.content.customPage.css, fonts: product.content.customPage.fonts, tailwind: product.content.customPage.tailwind, source: '' } : null,
        },
        payment: {
          method: product.payment.method,
          // Seuls les liens publics sortent ; les identifiants Chariow/Maketou restent côté serveur.
          externalUrl: product.payment.method === 'integration' ? (product.payment.integration?.url ?? null) : null,
          platform: product.payment.method === 'integration' ? (product.payment.integration?.platform ?? null) : null,
        },
        variantLabel: product.variantLabel,
        variants: variants.map((vr) => ({ id: vr.id, name: vr.name, sku: vr.sku || `${product.sku || product.id}-${vr.id}`, price: vr.price != null ? displayPrice(product, store.currency, vr) : null, inStock: !product.trackInventory || vr.stock == null || vr.stock > 0 })),
        inStock: bundle ? bundle.inStock : !product.trackInventory || product.stock == null || product.stock > 0,
        /** Pack : produits inclus (pour la page de vente). */
        bundle: bundle?.items ?? null,
      },
      /** Tunnel : order bump et offres après commande, avec les infos produit nécessaires à l'affichage. */
      funnel,
      zones,
      // Panier en observation : masqué tant qu'il n'est pas ouvert pour le propriétaire de la boutique.
      checkout: { ...withCheckoutDefaults(cfg?.settings), cart: { enabled: Boolean(cfg?.settings.cart?.enabled) && (await storeCartAllowed(store.id)) } },
      /** Formulaire effectif : celui du produit s'il est personnalisé, sinon celui de la boutique. */
      orderForm: parseOrderForm(product.content.orderForm ?? cfg?.settings.form),
      tracking: { facebookPixelId: cfg?.facebookPixelId ?? null, tiktokPixelId: cfg?.tiktokPixelId ?? null },
      onlinePaymentEnabled,
      /** Paiement en ligne : via Payment Orchestrator (widget) ou directement réseau par réseau. Aucun secret ici. */
      paymentGateway: poAcc ? { kind: 'orchestrator' as const, widgetMode: poAcc.settings.widgetMode, locale: poAcc.settings.locale, widgetUrl: `${env.PO_BASE_URL.replace(/\/$/, '')}/widget.js`, test: !poAcc.livemode } : { kind: 'direct' as const },
    })
  })
  .post('/promo/check', rateLimit({ key: 'promo', limit: 30, windowSec: 300 }), v('json', z.object({ storeSlug: z.string(), productId: productIdSchema, code: z.string().trim().toUpperCase().max(30), subtotal: z.coerce.number().min(0) })), async (c) => {
    const body = c.req.valid('json')
    const store = await storeBySlug(body.storeSlug)
    const [rule] = await db.select().from(promoCodes).where(and(eq(promoCodes.storeId, store.id), eq(promoCodes.code, body.code))).limit(1)
    if (!rule) return c.json({ ok: false, reason: 'Code invalide' })
    const res = evaluatePromoCode(rule, body.subtotal, [body.productId], store.currency)
    return c.json(res.ok ? { ...res, code: rule.code, type: rule.type, value: rule.value } : res)
  })
  .post('/orders', rateLimit({ key: 'order', limit: 15, windowSec: 600 }), v('json', publicOrderCreateSchema), async (c) => {
    const { order, promoError } = await createPublicOrder(c.req.valid('json'), {
      ip: clientIp((n) => c.req.header(n)),
      userAgent: c.req.header('user-agent')?.slice(0, 512),
    })
    const [cod] = await db.select({ on: checkoutSettings.codPurchaseOn }).from(checkoutSettings).where(eq(checkoutSettings.storeId, order.storeId)).limit(1)
    return c.json(
      {
        // pixelEvent : Purchase, ou Lead en paiement à la livraison si l'achat n'est déclaré qu'à la confirmation ou à la livraison.
        order: { token: order.accessToken, orderNumber: order.orderNumber, total: order.total, currency: order.currency, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, eventId: order.eventId, pixelEvent: arrivalEvent(order, cod?.on) },
        promoError,
      },
      201,
    )
  })
  /** Tunnel : réponse du client à un upsell / downsell (ajout à la même commande). */
  .post('/orders/:token/funnel', rateLimit({ key: 'funnel', limit: 30, windowSec: 600 }), v('param', z.object({ token: z.string().min(20).max(64) })), v('json', funnelAnswerSchema), async (c) => {
    return c.json(await answerFunnelOffer(c.req.valid('param').token, c.req.valid('json')))
  })
  /** Vue publique d'une commande, par jeton opaque uniquement (plus d'ID séquentiel). */
  .get('/orders/:token', v('param', z.object({ token: z.string().min(20).max(64) })), async (c) => {
    const [order] = await db.select().from(orders).where(eq(orders.accessToken, c.req.valid('param').token)).limit(1)
    if (!order) throw notFound('Commande')
    const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1)
    const [cfg] = await db.select({ settings: checkoutSettings.settings, facebookPixelId: checkoutSettings.facebookPixelId, tiktokPixelId: checkoutSettings.tiktokPixelId, codPurchaseOn: checkoutSettings.codPurchaseOn }).from(checkoutSettings).where(eq(checkoutSettings.storeId, order.storeId)).limit(1)
    const items = await db.select({ productId: orderItems.productId, name: orderItems.name, variantName: orderItems.variantName, quantity: orderItems.quantity, total: orderItems.total, productType: orderItems.productType }).from(orderItems).where(eq(orderItems.orderId, order.id))
    c.header('Cache-Control', 'no-store')
    // Paiement en attente via Payment Orchestrator : la page commande propose de finaliser avec le widget.
    const poAcc = order.paymentStatus === 'pending' && order.paymentMethod === 'mobile_money' ? await poAccount(order.storeId) : null
    return c.json({
      orderNumber: order.orderNumber,
      paymentGateway: poAcc ? { kind: 'orchestrator' as const, widgetMode: poAcc.settings.widgetMode, locale: poAcc.settings.locale, widgetUrl: `${env.PO_BASE_URL.replace(/\/$/, '')}/widget.js`, test: !poAcc.livemode } : { kind: 'direct' as const },
      store: store ? publicStore(store) : null,
      customerName: order.customerName,
      items,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      eventId: order.eventId,
      pixelEvent: arrivalEvent(order, cfg?.codPurchaseOn),
      canDownload: order.kind !== 'physical' && order.paymentStatus === 'paid',
      // Thème + pixels : la page commande garde l'apparence de la boutique et peut déclarer l'achat une fois payé.
      primaryColor: cfg?.settings.primaryColor ?? DEFAULT_CHECKOUT.primaryColor,
      template: cfg?.settings.template ?? DEFAULT_CHECKOUT.template,
      tracking: { facebookPixelId: cfg?.facebookPixelId ?? null, tiktokPixelId: cfg?.tiktokPixelId ?? null },
      createdAt: order.createdAt,
    })
  })
  .post('/orders/:token/download', rateLimit({ key: 'download', limit: 20, windowSec: 600 }), v('param', z.object({ token: z.string().min(20).max(64) })), async (c) => {
    const [order] = await db.select().from(orders).where(eq(orders.accessToken, c.req.valid('param').token)).limit(1)
    if (!order) throw notFound('Commande')
    if (order.paymentStatus !== 'paid') throw badRequest('Paiement non confirmé', 'not_paid')
    // Toutes les lignes digitales (produit, order bump, upsells) ; un pack livre chacun des produits inclus.
    const lines = await db.select({ productId: orderItems.productId, bundle: orderItems.bundle }).from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productType, 'digital')))
    const ids = [...new Set(lines.flatMap((l) => (l.bundle?.length ? l.bundle.map((b) => b.productId) : l.productId ? [l.productId] : [])))]
    const rows = ids.length ? await db.select({ productId: products.id, name: products.name, delivery: products.delivery }).from(products).where(inArray(products.id, ids)) : []
    const links = rows.flatMap((r) => {
      if (!r.delivery) return []
      if (r.delivery.type === 'external_url') return [{ name: r.name, url: r.delivery.url, external: true }]
      return r.delivery.filePath ? [{ name: r.name, url: signedUrl(r.delivery.filePath, 1800), external: false }] : []
    })
    if (rows[0]) await db.insert(downloads).values({ orderId: order.id, productId: rows[0].productId, ipHash: sha256(clientIp((n) => c.req.header(n))) })
    c.header('Cache-Control', 'no-store')
    return c.json({ links, expiresIn: 1800 })
  })
  /** Panier abandonné : coordonnées laissées dans le formulaire. */
  .post('/leads', rateLimit({ key: 'lead', limit: 20, windowSec: 600 }), v('json', z.object({ storeSlug: z.string(), productId: productIdSchema, email: z.string().trim().toLowerCase().email().optional(), phone: z.string().max(30).optional(), name: z.string().max(120).optional(), fbp: z.string().max(200).optional(), fbc: z.string().max(200).optional(), url: z.string().url().max(2000).optional() })), async (c) => {
    const body = c.req.valid('json')
    if (!body.email && !body.phone) throw badRequest('Email ou téléphone requis')
    const store = await storeBySlug(body.storeSlug)
    const [product] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, body.productId), eq(products.storeId, store.id))).limit(1)
    if (!product) throw notFound('Produit')
    const phone = body.phone ? normalizePhone(body.phone) : null
    const firstReminder = new Date(Date.now() + 3600_000)
    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.storeId, store.id), eq(leads.productId, product.id), isNull(leads.convertedAt), body.email ? eq(leads.email, body.email) : eq(leads.phone, phone!)))
      .limit(1)
    if (existing[0]) {
      await db.update(leads).set({ name: body.name, phone: phone ?? undefined, email: body.email ?? undefined }).where(eq(leads.id, existing[0].id))
    } else {
      const [created] = await db.insert(leads).values({ storeId: store.id, productId: product.id, email: body.email ?? null, phone, name: body.name ?? null, nextReminderAt: firstReminder }).onConflictDoNothing().returning({ id: leads.id })
      // Panier abandonné : prospect (Lead) pour Meta si aucune commande dans les 15 min.
      if (created) await enqueue('lead.capi', { leadId: created.id, ip: clientIp((n) => c.req.header(n)), userAgent: c.req.header('user-agent')?.slice(0, 512), fbp: body.fbp, fbc: body.fbc, url: body.url }, { startAfter: 900, singletonKey: `lead.capi:${created.id}` })
    }
    return c.json({ ok: true }, 202)
  })
  .post(
    '/track',
    rateLimit({ key: 'track', limit: 240, windowSec: 60 }),
    v('json', z.object({ storeId: storeIdSchema, productId: productIdSchema.nullable().optional(), eventType: z.enum(EVENT_TYPES), sessionId: z.string().min(8).max(64), visitorId: z.string().min(8).max(64).optional(), referrer: z.string().max(2048).optional(), utmSource: z.string().max(255).optional(), utmMedium: z.string().max(255).optional(), utmCampaign: z.string().max(255).optional(), metadata: z.record(z.string(), z.unknown()).optional() })),
    async (c) => {
      const b = c.req.valid('json')
      const ua = c.req.header('user-agent') ?? ''
      // Robots (aperçus de liens, moteurs, outils de test) : jamais comptés comme visiteurs.
      if (!ua || BOT_UA.test(ua)) return c.body(null, 204)
      const device = /tablet|ipad/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
      const metadata = b.metadata && JSON.stringify(b.metadata).length <= 4000 ? b.metadata : undefined
      const geo = geoOf((n) => c.req.header(n))
      // L'insert ignore silencieusement une boutique/produit inexistant (pas de 500 exploitable).
      await db.execute(dsql`
        insert into ${pageEvents} (store_id, product_id, event_type, session_id, visitor_id, ip_hash, referrer, utm_source, utm_medium, utm_campaign, device_type, country, city, region, latitude, longitude, metadata)
        select ${b.storeId}, p.id, ${b.eventType}, ${b.sessionId}, ${b.visitorId ?? null}, ${sha256(clientIp((n) => c.req.header(n)))}, ${b.referrer ?? null}, ${b.utmSource ?? null}, ${b.utmMedium ?? null}, ${b.utmCampaign ?? null}, ${device}, ${c.req.header('cf-ipcountry')?.slice(0, 2) ?? null}, ${geo.city}, ${geo.region}, ${geo.lat}, ${geo.lon}, ${metadata ? JSON.stringify(metadata) : null}::jsonb
        from ${stores} s left join ${products} p on p.id = ${b.productId ?? null} and p.store_id = s.id
        where s.id = ${b.storeId}`)
      return c.body(null, 204)
    },
  )
  /**
   * InitiateCheckout côté serveur (API Conversions), avec le même event_id que le pixel du navigateur :
   * Meta déduplique. Aucun effet si la boutique n'a pas de pixel et de jeton. Réponse immédiate.
   */
  .post(
    '/capi/checkout',
    rateLimit({ key: 'capi-checkout', limit: 30, windowSec: 600 }),
    v('json', z.object({ storeId: storeIdSchema, productId: productIdSchema, eventId: z.string().regex(/^[\w-]{8,80}$/), fbp: z.string().max(200).optional(), fbc: z.string().max(200).optional(), url: z.string().url().max(2000).optional() })),
    async (c) => {
      const b = c.req.valid('json')
      const ua = c.req.header('user-agent') ?? ''
      if (!ua || BOT_UA.test(ua)) return c.body(null, 204)
      const [cfg] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, b.storeId)).limit(1)
      if (!cfg?.facebookPixelId || !cfg.facebookAccessTokenEnc) return c.body(null, 204)
      const [row] = await db.select({ p: products, s: stores }).from(products).innerJoin(stores, eq(stores.id, products.storeId)).where(and(eq(products.id, b.productId), eq(products.storeId, b.storeId))).limit(1)
      if (!row) return c.body(null, 204)
      const price = displayPrice(row.p, row.s.currency)
      const { sendCapiEvent } = await import('../services/notify')
      const { decrypt } = await import('../lib/crypto')
      void sendCapiEvent({
        storeId: b.storeId,
        logMode: 'errors',
        pixelId: cfg.facebookPixelId,
        accessToken: decrypt(cfg.facebookAccessTokenEnc),
        testEventCode: cfg.facebookTestEventCode,
        eventName: 'InitiateCheckout',
        eventId: b.eventId,
        eventTime: new Date(),
        sourceUrl: b.url,
        value: price.effective,
        currency: price.currency,
        user: { country: row.s.country, ip: clientIp((n) => c.req.header(n)), userAgent: ua.slice(0, 512), fbp: b.fbp, fbc: b.fbc },
        contentIds: [row.p.id],
        contentName: row.p.name,
      }).catch(() => undefined)
      return c.body(null, 204)
    },
  )
  /** Preuve sociale RÉELLE : prénoms + villes des dernières ventes (jamais de nom complet ni de contact). */
  .get('/stores/:slug/recent-sales', async (c) => {
    const store = await storeBySlug(c.req.param('slug'))
    const rows = await db
      .select({ name: orders.customerName, city: orders.city, product: orderItems.name, productId: orderItems.productId, at: orders.createdAt })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.storeId, store.id), gte(orders.createdAt, new Date(Date.now() - 14 * 86400_000)), dsql`(${orders.paymentStatus} = 'paid' or ${orders.fulfillmentStatus} in ('confirmed','shipped','delivered'))`))
      .orderBy(desc(orders.createdAt))
      .limit(20)
    // Entrées configurées par le vendeur (comme les avis) : après les vraies commandes, sans heure (« récemment »).
    const [cfg] = await db.select({ settings: checkoutSettings.settings }).from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1)
    // Sur une page de vente : les messages de ce produit (et ceux sans produit), pas ceux des autres produits.
    const forProduct = c.req.query('product')
    const entries = (cfg?.settings.salesPopup?.entries ?? [])
      .filter((m) => !forProduct || !m.productId || m.productId === forProduct)
      .map((m) => ({ firstName: m.firstName.trim().split(/\s+/)[0] || 'Un client', city: m.city || null, product: m.product, productId: m.productId ?? null, text: m.text || null, at: null as Date | null }))
    const real = rows.map((r) => ({ firstName: (r.name ?? '').trim().split(/\s+/)[0] || 'Un client', city: r.city, product: r.product, productId: r.productId, text: null as string | null, at: r.at as Date | null }))
    const all = [...real, ...entries].slice(0, 40)
    // Photo du produit (style « carte ») : miniature, sinon couverture.
    const ids = [...new Set(all.map((x) => x.productId).filter((x): x is string => !!x))]
    const pics = ids.length ? await db.select({ id: products.id, thumb: products.thumbnail, cover: products.coverImage }).from(products).where(and(inArray(products.id, ids), eq(products.storeId, store.id))) : []
    const image = new Map(pics.map((p) => [p.id, publicUrl(p.thumb ?? p.cover)]))
    c.header('Cache-Control', 'public, max-age=120')
    return c.json(all.map(({ productId, ...x }) => ({ ...x, image: productId ? (image.get(productId) ?? null) : null })))
  })
