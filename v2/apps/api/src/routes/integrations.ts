/**
 * Webhook entrant des plateformes externes (Selar via Zapier/n8n).
 * Même chemin et même en-tête qu'en v1 (/api/v1/webhooks/external + X-Webhook-Secret) :
 * seul le secret change, il est désormais propre à chaque boutique.
 */
import { and, eq, isNotNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { orderEvents, orderItems, orders, products, stores } from '../db/schema'
import type { AppEnv } from '../lib/context'
import { decrypt, orderNumber, randomToken, safeEqual } from '../lib/crypto'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { markOrderPaid, normalizePhone } from '../services/orders'

const payloadSchema = z.object({
  platform: z.literal('selar'),
  status: z.enum(['paid', 'failed', 'refunded']),
  metadata: z
    .object({
      product_code: z.string().optional(),
      all_product_codes: z.string().optional(),
      buyer_email: z.string().email(),
      buyer_full_name: z.string().optional(),
      buyer_mobile: z.string().optional(),
      total_amount: z.coerce.number().optional(),
      product_amount: z.coerce.number().optional(),
      currency: z.string().max(5).optional(),
      receipt_url: z.string().max(500).optional(),
    })
    .passthrough(),
})

export const integrationRoutes = new Hono<AppEnv>().post('/webhooks/external', rateLimit({ key: 'ext-hook', limit: 120, windowSec: 60 }), v('json', payloadSchema), async (c) => {
  const provided = c.req.header('x-webhook-secret') ?? ''
  const { platform, status, metadata: m } = c.req.valid('json')
  const code = m.product_code ?? m.all_product_codes?.split(',')[0]?.trim()
  if (!code) throw new HttpError(422, 'Code produit manquant', 'missing_product_code')

  // Le code produit peut exister dans plusieurs boutiques : c'est le secret qui désigne la bonne.
  const candidates = await db
    .select({ product: products, store: stores })
    .from(products)
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(and(eq(products.externalProductId, code), isNotNull(stores.integrationSecretEnc)))
  const match = candidates.find(({ store }) => provided.length > 0 && safeEqual(decrypt(store.integrationSecretEnc!), provided))
  if (!match) throw new HttpError(401, 'Non autorisé', 'unauthorized')
  const { product, store } = match
  const receipt = m.receipt_url ?? null

  const existing = receipt
    ? (await db.select().from(orders).where(and(eq(orders.storeId, store.id), eq(orders.paymentRef, receipt))).limit(1))[0]
    : undefined

  if (existing) {
    if (status === 'refunded' && existing.paymentStatus !== 'refunded') {
      await db.update(orders).set({ paymentStatus: 'refunded', fulfillmentStatus: 'returned', returnedAt: new Date() }).where(eq(orders.id, existing.id))
      await db.insert(orderEvents).values({ orderId: existing.id, type: 'payment_refunded', message: `Remboursée sur ${platform}` })
    } else if (status === 'paid') {
      await markOrderPaid(existing.id, { provider: platform, ref: receipt })
    }
    return c.json({ success: true, orderId: existing.id, duplicate: true })
  }

  const amount = m.total_amount ?? m.product_amount ?? product.price
  const [order] = await db
    .insert(orders)
    .values({
      storeId: store.id,
      orderNumber: orderNumber(),
      accessToken: randomToken(24),
      customerName: m.buyer_full_name ?? null,
      customerEmail: m.buyer_email.toLowerCase(),
      customerPhone: m.buyer_mobile ? normalizePhone(m.buyer_mobile).slice(0, 30) : null,
      kind: product.type,
      subtotal: amount,
      total: amount,
      currency: (m.currency ?? store.currency).toUpperCase(),
      paymentMethod: 'external',
      paymentProvider: platform,
      paymentRef: receipt,
      paymentStatus: status === 'failed' ? 'failed' : 'pending',
      source: platform,
      eventId: randomToken(16),
      metadata: m as Record<string, unknown>,
    })
    .returning()
  if (!order) throw new Error('Création commande échouée')
  await db.insert(orderItems).values({ orderId: order.id, productId: product.id, productType: product.type, name: product.name, quantity: 1, unitPrice: amount, total: amount })
  await db.insert(orderEvents).values({ orderId: order.id, type: 'created', message: `Vente reçue depuis ${platform}` })
  if (status === 'paid') await markOrderPaid(order.id, { provider: platform, ref: receipt })
  return c.json({ success: true, orderId: order.id, status })
})

/** Côté dashboard : génère (ou régénère) le secret d'intégration, affiché une seule fois. */
export async function rotateIntegrationSecret(storeId: string) {
  const secret = `whsec_${randomToken(24)}`
  const { encrypt } = await import('../lib/crypto')
  await db.update(stores).set({ integrationSecretEnc: encrypt(secret) }).where(eq(stores.id, storeId))
  return secret
}
