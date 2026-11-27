import { checkoutSettingsSchema, storeCloseSchema, storeCreateSchema, storePauseSchema, storeUpdateSchema, timezoneForCountry, trackingSettingsSchema } from '@zuri/shared'
import { and, count, eq, gte, inArray, ne, or, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { checkoutSettings, deliveryZones, orders, pageEvents, products, promoCodes, storeMembers, stores } from '../db/schema'
import { z } from 'zod'
import { requireAuth, requirePermission, requireStore } from '../lib/auth'
import { logActivity, tagApiOrderEvents } from '../services/activity'
import { activityRoutes } from './activity'
import { teamRoutes } from './team'
import { storeNotificationRoutes } from './notifications'
import type { AppEnv } from '../lib/context'
import { decrypt, encrypt } from '../lib/crypto'
import { clientIp } from '../lib/rate-limit'
import { conflict } from '../lib/errors'
import { v } from '../lib/validate'
import { customerRoutes } from './customers'
import { orderRoutes } from './orders'
import { paymentAccountRoutes } from './payment-accounts'
import { productRoutes } from './products'
import { productImportRoutes } from './product-import'
import { productImportUrlRoutes } from './product-import-url'
import { launchRoutes } from './launch'
import { productAiRoutes } from './product-ai'
import { promoRoutes } from './promos'
import { walletRoutes } from './wallet'
import { digitalStatsRoute, funnelStatsRoute, statsRoutes } from './stats'
import { liveRoute } from './live'
import { trafficRoute } from './traffic'
import { expenseRoutes } from './expenses'
import { leadRoutes } from './leads'
import { uploadRoutes } from './uploads'
import { zoneRoutes } from './zones'
import { rotateIntegrationSecret } from './integrations'
import { env } from '../lib/env'
import { HttpError } from '../lib/errors'
import { assertWithinLimit, countOwnedStores, planForUser } from '../services/platform'

export const DEFAULT_CHECKOUT = checkoutSettingsSchema.parse({})

/**
 * Réglages enregistrés complétés par les valeurs par défaut : une boutique créée avant
 * l'ajout d'un réglage (ex. bouton collant) le reçoit quand même, sans migration.
 */
export function withCheckoutDefaults(settings: unknown) {
  const r = checkoutSettingsSchema.safeParse(settings ?? {})
  return r.success ? r.data : { ...DEFAULT_CHECKOUT, ...(settings as object) }
}

/** Jamais de secret (même chiffré) dans une réponse. */
const storeView = ({ integrationSecretEnc, ...rest }: typeof stores.$inferSelect) => ({ ...rest, hasIntegrationSecret: Boolean(integrationSecretEnc) })

async function assertUnique(fields: { slug?: string; subdomain?: string | null; customDomain?: string | null }, exceptId?: string) {
  const conds = []
  if (fields.slug) conds.push(eq(stores.slug, fields.slug))
  if (fields.subdomain) conds.push(eq(stores.subdomain, fields.subdomain))
  if (fields.customDomain) conds.push(eq(stores.customDomain, fields.customDomain))
  if (!conds.length) return
  const [hit] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(exceptId ? and(or(...conds), ne(stores.id, exceptId)) : or(...conds))
    .limit(1)
  if (hit) throw conflict('Ce slug, sous-domaine ou domaine est déjà utilisé', 'store_taken')
}

/** Pause et fermeture : réservées au propriétaire (et au super admin). */
function assertOwner(c: { get: (k: 'access' | 'user') => any }) {
  if (c.get('access').role !== 'owner' && !c.get('user').isPlatformAdmin) throw new HttpError(403, 'Seul le propriétaire peut faire cette action', 'owner_only')
}

const storeScoped = new Hono<AppEnv>()
  .get('/', (c) => c.json(storeView(c.get('store'))))
  /** Mettre la boutique en pause : la page reste visible avec un message, les commandes sont refusées. */
  .post('/pause', v('json', storePauseSchema), async (c) => {
    assertOwner(c)
    const store = c.get('store')
    const [row] = await db.update(stores).set({ status: 'paused', pausedAt: new Date(), pauseMessage: c.req.valid('json').message || null }).where(eq(stores.id, store.id)).returning()
    await logActivity(c, { entityType: 'store', entityId: store.id, action: 'paused', message: 'Boutique mise en pause' })
    return c.json(storeView(row!))
  })
  .post('/resume', async (c) => {
    assertOwner(c)
    const store = c.get('store')
    if (store.closedAt && !c.get('user').isPlatformAdmin) throw new HttpError(409, 'Cette boutique est fermée définitivement', 'store_closed')
    const [row] = await db.update(stores).set({ status: 'active', pausedAt: null, closedAt: null }).where(eq(stores.id, store.id)).returning()
    await logActivity(c, { entityType: 'store', entityId: store.id, action: 'resumed', message: 'Boutique rouverte' })
    return c.json(storeView(row!))
  })
  /** Fermeture définitive : la boutique disparaît (pages, liens, tableau de bord). Les données sont conservées pour l'historique. */
  .post('/close', v('json', storeCloseSchema), async (c) => {
    assertOwner(c)
    const store = c.get('store')
    if (c.req.valid('json').confirmName !== store.name) throw new HttpError(422, 'Le nom saisi ne correspond pas au nom de la boutique', 'confirm_mismatch')
    await db.update(stores).set({ status: 'closed', closedAt: new Date() }).where(eq(stores.id, store.id))
    await logActivity(c, { entityType: 'store', entityId: store.id, action: 'closed', message: 'Boutique fermée définitivement' })
    return c.json({ ok: true })
  })
  .patch('/', requirePermission('store.settings'), v('json', storeUpdateSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    await assertUnique(input, store.id)
    const patch: Partial<typeof stores.$inferInsert> = { ...input }
    // Changer de domaine perso remet la vérification à zéro.
    if (input.customDomain !== undefined && input.customDomain !== store.customDomain) patch.customDomainVerifiedAt = null
    const [row] = await db.update(stores).set(patch).where(eq(stores.id, store.id)).returning()
    await logActivity(c, { entityType: 'store', entityId: store.id, entityLabel: row?.name ?? store.name, action: 'updated', message: `Réglages de la boutique modifiés (${Object.keys(input).join(', ')})` })
    return c.json(row ? storeView(row) : null)
  })
  .get('/checkout-settings', requirePermission('store.settings'), async (c) => {
    const [row] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, c.get('store').id)).limit(1)
    return c.json({
      settings: withCheckoutDefaults(row?.settings),
      tracking: {
        facebookPixelId: row?.facebookPixelId ?? null,
        facebookTestEventCode: row?.facebookTestEventCode ?? null,
        tiktokPixelId: row?.tiktokPixelId ?? null,
        codPurchaseOn: row?.codPurchaseOn ?? 'delivered',
        hasFacebookAccessToken: Boolean(row?.facebookAccessTokenEnc),
        /** Derniers envois serveur à Meta (réponse ou erreur, jamais le jeton). */
        capiLog: row?.capiLog ?? [],
      },
    })
  })
  /** Popups marketing : vues, clics, numéros laissés et commandes passées avec leur code (30 derniers jours). */
  .get('/marketing-popups/stats', requirePermission('store.settings'), async (c) => {
    const store = c.get('store')
    const since = new Date(Date.now() - 30 * 86400_000)
    const [cfg] = await db.select({ settings: checkoutSettings.settings }).from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1)
    const popups = cfg?.settings.marketingPopups ?? []
    const ev = await db
      .select({ id: dsql<string | null>`${pageEvents.metadata}->>'popupId'`, type: pageEvents.eventType, n: dsql<number>`count(distinct ${pageEvents.sessionId})::int` })
      .from(pageEvents)
      .where(and(eq(pageEvents.storeId, store.id), gte(pageEvents.createdAt, since), inArray(pageEvents.eventType, ['popup_view', 'popup_click', 'popup_lead'])))
      .groupBy(dsql`1`, pageEvents.eventType)
    const codes = [...new Set(popups.map((p) => p.promoCode).filter((x): x is string => Boolean(x)))]
    const used = codes.length
      ? await db
          .select({ code: promoCodes.code, n: count(orders.id) })
          .from(promoCodes)
          .innerJoin(orders, eq(orders.promoCodeId, promoCodes.id))
          .where(and(eq(promoCodes.storeId, store.id), inArray(promoCodes.code, codes), gte(orders.createdAt, since)))
          .groupBy(promoCodes.code)
      : []
    const out: Record<string, { views: number; clicks: number; leads: number; orders: number }> = {}
    for (const p of popups) out[p.id] = { views: 0, clicks: 0, leads: 0, orders: used.find((u) => u.code === p.promoCode)?.n ?? 0 }
    for (const r of ev) {
      const row = r.id ? out[r.id] : undefined
      if (!row) continue
      if (r.type === 'popup_view') row.views = r.n
      else if (r.type === 'popup_click') row.clicks = r.n
      else row.leads = r.n
    }
    return c.json(out)
  })
  /** Messages de la popup de ventes rédigés par l'IA (réservé aux comptes avec l'IA ouverte, comme la rédaction). */
  .post(
    '/sales-popup/generate',
    requirePermission('store.settings'),
    v('json', z.object({ count: z.coerce.number().int().min(1).max(30).default(10), instructions: z.string().trim().max(600).optional(), productIds: z.array(z.string().max(40)).max(50).optional() })),
    async (c) => {
      const store = c.get('store')
      const { resolveFeatures } = await import('../services/platform')
      const { aiAvailable } = await import('../services/ai-suggest')
      if (!(await resolveFeatures(c.get('user'))).urlImport || !aiAvailable()) throw new HttpError(403, 'La génération par l’IA n’est pas ouverte sur ce compte.', 'ai_disabled')
      const b = c.req.valid('json')
      const list = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.storeId, store.id))
      const chosen = b.productIds?.length ? list.filter((p) => b.productIds!.includes(p.id)) : list
      if (!chosen.length) throw new HttpError(400, 'Ajoutez d’abord un produit.', 'no_product')
      const zones = await db.select({ cities: deliveryZones.cities }).from(deliveryZones).where(eq(deliveryZones.storeId, store.id))
      const cities = [...new Set(zones.flatMap((z) => z.cities ?? []))].slice(0, 40)
      const { generatePopupEntries } = await import('../services/ai-popup')
      const entries = await generatePopupEntries({ count: b.count, country: store.country, locale: store.locale, products: chosen.map((p) => p.name), cities, instructions: b.instructions })
      return c.json(entries.map((e) => ({ ...e, productId: chosen.find((p) => p.name === e.product)?.id })))
    },
  )
  /** Test de l'API Conversions : un événement de test (code d'événement test obligatoire), réponse de Meta renvoyée. */
  .post('/tracking/capi-test', requirePermission('store.settings'), async (c) => {
    const store = c.get('store')
    const [row] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, store.id)).limit(1)
    if (!row?.facebookPixelId) throw new HttpError(400, 'Renseignez d’abord l’ID du pixel Meta.', 'no_pixel')
    if (!row.facebookAccessTokenEnc) throw new HttpError(400, 'Renseignez d’abord le jeton de l’API Conversions.', 'no_token')
    if (!row.facebookTestEventCode) throw new HttpError(400, 'Renseignez le code d’événement test (Gestionnaire d’événements, onglet Événements de test) : le test n’apparaît que là, sans fausser vos statistiques.', 'no_test_code')
    const { sendCapiEvent } = await import('../services/notify')
    const result = await sendCapiEvent({
      storeId: store.id,
      pixelId: row.facebookPixelId,
      accessToken: decrypt(row.facebookAccessTokenEnc),
      testEventCode: row.facebookTestEventCode,
      eventName: 'PageView',
      eventId: `test_${crypto.randomUUID()}`,
      eventTime: new Date(),
      sourceUrl: `https://${store.subdomain || store.slug}.${env.BASE_DOMAIN}/`,
      value: 0,
      currency: store.currency,
      user: { country: store.country, ip: clientIp((n) => c.req.header(n)), userAgent: c.req.header('user-agent')?.slice(0, 512) },
      contentIds: [],
      orderId: 'test',
    }).catch((e: Error) => ({ ok: false, status: null, eventsReceived: null, fbtraceId: null, error: e.message }))
    return c.json(result)
  })
  .put('/checkout-settings', requirePermission('store.settings'), v('json', checkoutSettingsSchema), async (c) => {
    const storeId = c.get('store').id
    const settings = c.req.valid('json')
    await db.insert(checkoutSettings).values({ storeId, settings }).onConflictDoUpdate({ target: checkoutSettings.storeId, set: { settings } })
    await logActivity(c, { entityType: 'store', entityId: storeId, action: 'checkout_updated', message: 'Réglages du formulaire de commande modifiés' })
    return c.json({ settings })
  })
  .put('/tracking', requirePermission('store.settings'), v('json', trackingSettingsSchema), async (c) => {
    const storeId = c.get('store').id
    const t = c.req.valid('json')
    const patch = {
      facebookPixelId: t.facebookPixelId,
      facebookTestEventCode: t.facebookTestEventCode,
      tiktokPixelId: t.tiktokPixelId,
      ...(t.codPurchaseOn ? { codPurchaseOn: t.codPurchaseOn } : {}),
      // undefined = inchangé, null = supprimer, string = remplacer
      ...(t.facebookAccessToken !== undefined ? { facebookAccessTokenEnc: t.facebookAccessToken ? encrypt(t.facebookAccessToken) : null } : {}),
    }
    await db
      .insert(checkoutSettings)
      .values({ storeId, settings: DEFAULT_CHECKOUT, ...patch })
      .onConflictDoUpdate({ target: checkoutSettings.storeId, set: patch })
    await logActivity(c, { entityType: 'store', entityId: storeId, action: 'tracking_updated', message: 'Pixels de suivi modifiés' })
    return c.json({ ok: true })
  })
  .get('/integrations', requirePermission('integrations.manage'), (c) =>
    c.json({ webhookUrl: `${env.APP_URL.replace(/\/$/, '')}/api/v1/webhooks/external`, hasSecret: Boolean(c.get('store').integrationSecretEnc) }),
  )
  .post('/integrations/secret', requirePermission('integrations.manage'), async (c) => c.json({ secret: await rotateIntegrationSecret(c.get('store').id) }))
  .route('/launch', launchRoutes)
  .route('/products/ai', productAiRoutes)
  .route('/products/import/url', productImportUrlRoutes)
  .route('/products/import', productImportRoutes)
  .route('/products', productRoutes)
  .use('/orders/*', tagApiOrderEvents)
  .use('/orders', tagApiOrderEvents)
  .route('/orders', orderRoutes)
  .route('/customers', customerRoutes)
  .route('/zones', zoneRoutes)
  .route('/promo-codes', promoRoutes)
  .route('/wallet', walletRoutes)
  .route('/payment-accounts', paymentAccountRoutes)
  .route('/stats', statsRoutes)
  .route('/stats', funnelStatsRoute)
  .route('/stats', digitalStatsRoute)
  .route('/stats', trafficRoute)
  .route('/stats', liveRoute)
  .route('/expenses', expenseRoutes)
  .route('/leads', leadRoutes)
  .route('/uploads', uploadRoutes)
  .route('/team', teamRoutes)
  .route('/activity', activityRoutes)
  .route('/notifications', storeNotificationRoutes)

export const storeRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', v('json', storeCreateSchema), async (c) => {
    const input = c.req.valid('json')
    const user = c.get('user')
    if (c.get('apiKey')?.storeId) throw new HttpError(403, 'Cette clé API est limitée à une boutique', 'api_key_forbidden')
    if (!user.isPlatformAdmin) assertWithinLimit(await planForUser(user), 'stores', await countOwnedStores(user.id))
    await assertUnique({ slug: input.slug, subdomain: input.slug })
    const store = await db.transaction(async (tx) => {
      const [s] = await tx.insert(stores).values({ ...input, subdomain: input.slug, timezone: timezoneForCountry(input.country) }).returning()
      if (!s) throw new Error('Création boutique échouée')
      await tx.insert(storeMembers).values({ storeId: s.id, userId: c.get('user').id, role: 'owner' })
      await tx.insert(checkoutSettings).values({ storeId: s.id, settings: DEFAULT_CHECKOUT })
      return s
    })
    return c.json(storeView(store), 201)
  })
  .use('/:storeId/*', requireStore())
  .use('/:storeId', requireStore())
  .route('/:storeId', storeScoped)
