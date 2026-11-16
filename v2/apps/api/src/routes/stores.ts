import { checkoutSettingsSchema, storeCreateSchema, storeUpdateSchema, trackingSettingsSchema } from '@sellit/shared'
import { and, eq, ne, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { checkoutSettings, storeMembers, stores } from '../db/schema'
import { requireAuth, requireRole, requireStore } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { encrypt } from '../lib/crypto'
import { conflict } from '../lib/errors'
import { v } from '../lib/validate'
import { customerRoutes } from './customers'
import { orderRoutes } from './orders'
import { paymentAccountRoutes } from './payment-accounts'
import { productRoutes } from './products'
import { promoRoutes } from './promos'
import { statsRoutes } from './stats'
import { uploadRoutes } from './uploads'
import { zoneRoutes } from './zones'

export const DEFAULT_CHECKOUT = checkoutSettingsSchema.parse({})

async function assertUnique(fields: { slug?: string; subdomain?: string | null; customDomain?: string | null }, exceptId?: number) {
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

const storeScoped = new Hono<AppEnv>()
  .get('/', (c) => c.json(c.get('store')))
  .patch('/', requireRole('admin'), v('json', storeUpdateSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    await assertUnique(input, store.id)
    const patch: Partial<typeof stores.$inferInsert> = { ...input }
    // Changer de domaine perso remet la vérification à zéro.
    if (input.customDomain !== undefined && input.customDomain !== store.customDomain) patch.customDomainVerifiedAt = null
    const [row] = await db.update(stores).set(patch).where(eq(stores.id, store.id)).returning()
    return c.json(row)
  })
  .get('/checkout-settings', async (c) => {
    const [row] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, c.get('store').id)).limit(1)
    return c.json({
      settings: row?.settings ?? DEFAULT_CHECKOUT,
      tracking: {
        facebookPixelId: row?.facebookPixelId ?? null,
        facebookTestEventCode: row?.facebookTestEventCode ?? null,
        tiktokPixelId: row?.tiktokPixelId ?? null,
        hasFacebookAccessToken: Boolean(row?.facebookAccessTokenEnc),
      },
    })
  })
  .put('/checkout-settings', requireRole('admin'), v('json', checkoutSettingsSchema), async (c) => {
    const storeId = c.get('store').id
    const settings = c.req.valid('json')
    await db.insert(checkoutSettings).values({ storeId, settings }).onConflictDoUpdate({ target: checkoutSettings.storeId, set: { settings } })
    return c.json({ settings })
  })
  .put('/tracking', requireRole('admin'), v('json', trackingSettingsSchema), async (c) => {
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
    return c.json({ ok: true })
  })
  .route('/products', productRoutes)
  .route('/orders', orderRoutes)
  .route('/customers', customerRoutes)
  .route('/zones', zoneRoutes)
  .route('/promo-codes', promoRoutes)
  .route('/payment-accounts', paymentAccountRoutes)
  .route('/stats', statsRoutes)
  .route('/uploads', uploadRoutes)

export const storeRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', v('json', storeCreateSchema), async (c) => {
    const input = c.req.valid('json')
    await assertUnique({ slug: input.slug, subdomain: input.slug })
    const store = await db.transaction(async (tx) => {
      const [s] = await tx.insert(stores).values({ ...input, subdomain: input.slug }).returning()
      if (!s) throw new Error('Création boutique échouée')
      await tx.insert(storeMembers).values({ storeId: s.id, userId: c.get('user').id, role: 'owner' })
      await tx.insert(checkoutSettings).values({ storeId: s.id, settings: DEFAULT_CHECKOUT })
      return s
    })
    return c.json(store, 201)
  })
  .use('/:storeId/*', requireStore())
  .use('/:storeId', requireStore())
  .route('/:storeId', storeScoped)
