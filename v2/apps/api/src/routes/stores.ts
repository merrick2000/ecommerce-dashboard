import { checkoutSettingsSchema, storeCloseSchema, storeCreateSchema, storePauseSchema, storeUpdateSchema, timezoneForCountry, trackingSettingsSchema } from '@zuri/shared'
import { and, eq, ne, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { checkoutSettings, storeMembers, stores } from '../db/schema'
import { requireAuth, requirePermission, requireStore } from '../lib/auth'
import { logActivity, tagApiOrderEvents } from '../services/activity'
import { activityRoutes } from './activity'
import { teamRoutes } from './team'
import { storeNotificationRoutes } from './notifications'
import type { AppEnv } from '../lib/context'
import { encrypt } from '../lib/crypto'
import { conflict } from '../lib/errors'
import { v } from '../lib/validate'
import { customerRoutes } from './customers'
import { orderRoutes } from './orders'
import { paymentAccountRoutes } from './payment-accounts'
import { productRoutes } from './products'
import { productImportRoutes } from './product-import'
import { productImportUrlRoutes } from './product-import-url'
import { promoRoutes } from './promos'
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
        hasFacebookAccessToken: Boolean(row?.facebookAccessTokenEnc),
      },
    })
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
  .route('/products/import/url', productImportUrlRoutes)
  .route('/products/import', productImportRoutes)
  .route('/products', productRoutes)
  .use('/orders/*', tagApiOrderEvents)
  .use('/orders', tagApiOrderEvents)
  .route('/orders', orderRoutes)
  .route('/customers', customerRoutes)
  .route('/zones', zoneRoutes)
  .route('/promo-codes', promoRoutes)
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
