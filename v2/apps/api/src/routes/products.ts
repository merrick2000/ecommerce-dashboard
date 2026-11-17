import { productInputSchema, type ProductInput } from '@sellit/shared'
import { and, asc, desc, eq, inArray, notInArray, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db, type Tx } from '../db/client'
import { orderItems, orders, productVariants, products, type Product } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { sanitizeHtml } from '../lib/sanitize'
import { v } from '../lib/validate'
import { displayPrice } from '../services/pricing'
import { publicUrl } from '../services/storage'

const idParam = z.object({ id: z.coerce.number().int().positive() })

function toRow(input: ProductInput, storeId: number, baseCurrency: string) {
  const { variants: _variants, ...rest } = input
  return {
    ...rest,
    storeId,
    baseCurrency,
    // Le HTML vendeur est nettoyé à l'écriture : le storefront peut l'afficher sans risque.
    description: sanitizeHtml(input.description),
    content: { ...input.content, customText: input.content.customText ? sanitizeHtml(input.content.customText) : undefined },
    delivery: input.type === 'digital' ? input.delivery : null,
  }
}

async function syncVariants(tx: Tx, productId: number, variants: ProductInput['variants']) {
  const keepIds = variants.map((v) => v.id).filter((id): id is number => typeof id === 'number')
  await tx
    .delete(productVariants)
    .where(keepIds.length ? and(eq(productVariants.productId, productId), notInArray(productVariants.id, keepIds)) : eq(productVariants.productId, productId))
  for (const [position, variant] of variants.entries()) {
    const values = {
      productId,
      name: variant.name,
      sku: variant.sku ?? null,
      price: variant.price ?? null,
      stock: variant.stock ?? null,
      isActive: variant.isActive,
      position,
    }
    if (variant.id) await tx.update(productVariants).set(values).where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, productId)))
    else await tx.insert(productVariants).values(values)
  }
}

async function loadProduct(storeId: number, id: number) {
  const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.storeId, storeId))).limit(1)
  if (!product) throw notFound('Produit')
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.position))
  // Les clés S3 héritées (« covers/…webp ») sont résolues en URLs ; les URLs passent telles quelles.
  return {
    ...product,
    coverImage: publicUrl(product.coverImage),
    thumbnail: publicUrl(product.thumbnail),
    content: { ...product.content, gallery: product.content.gallery.map((g) => publicUrl(g)!).filter(Boolean) },
    variants,
  }
}

export const productRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const store = c.get('store')
    const rows = await db
      .select({
        product: products,
        sales: dsql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.paymentStatus} = 'paid' or ${orders.fulfillmentStatus} = 'delivered'), 0)::int`,
        revenue: dsql<number>`coalesce(sum(${orderItems.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)::float`,
        pending: dsql<number>`count(${orders.id}) filter (where ${orders.fulfillmentStatus} in ('new','unreachable'))::int`,
        variantStock: dsql<number | null>`(select sum(${productVariants.stock})::int from ${productVariants} where ${productVariants.productId} = ${products.id} and ${productVariants.isActive})`,
        variantCount: dsql<number>`(select count(*)::int from ${productVariants} where ${productVariants.productId} = ${products.id})`,
      })
      .from(products)
      .leftJoin(orderItems, eq(orderItems.productId, products.id))
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .where(eq(products.storeId, store.id))
      .groupBy(products.id)
      .orderBy(desc(products.createdAt))
    return c.json(
      rows.map(({ product, ...stats }) => ({
        id: product.id,
        type: product.type,
        name: product.name,
        isActive: product.isActive,
        thumbnail: publicUrl(product.thumbnail ?? product.coverImage),
        stock: product.stock,
        trackInventory: product.trackInventory,
        price: displayPrice(product, store.currency),
        createdAt: product.createdAt,
        ...stats,
      })),
    )
  })
  .get('/:id', v('param', idParam), async (c) => c.json(await loadProduct(c.get('store').id, c.req.valid('param').id)))
  .post('/', requireRole('admin'), v('json', productInputSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    const id = await db.transaction(async (tx) => {
      const [row] = await tx.insert(products).values(toRow(input, store.id, store.currency)).returning({ id: products.id })
      if (!row) throw new Error('Création produit échouée')
      await syncVariants(tx, row.id, input.variants)
      return row.id
    })
    return c.json(await loadProduct(store.id, id), 201)
  })
  .put('/:id', requireRole('admin'), v('param', idParam), v('json', productInputSchema), async (c) => {
    const store = c.get('store')
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const existing = await loadProduct(store.id, id)
    await db.transaction(async (tx) => {
      // La devise de base ne change pas silencieusement quand la boutique change de devise.
      await tx.update(products).set(toRow(input, store.id, existing.baseCurrency)).where(eq(products.id, id))
      await syncVariants(tx, id, input.variants)
    })
    return c.json(await loadProduct(store.id, id))
  })
  .patch('/:id/active', requireRole('staff'), v('param', idParam), v('json', z.object({ isActive: z.boolean() })), async (c) => {
    const { id } = c.req.valid('param')
    const [row] = await db
      .update(products)
      .set({ isActive: c.req.valid('json').isActive })
      .where(and(eq(products.id, id), eq(products.storeId, c.get('store').id)))
      .returning({ id: products.id, isActive: products.isActive })
    if (!row) throw notFound('Produit')
    return c.json(row)
  })
  .post('/:id/duplicate', requireRole('admin'), v('param', idParam), async (c) => {
    const store = c.get('store')
    const src = await loadProduct(store.id, c.req.valid('param').id)
    const { id: _id, createdAt: _c, updatedAt: _u, variants, ...rest } = src
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(products)
        .values({ ...(rest as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>), name: `${src.name} (copie)`, isActive: false, externalProductId: null })
        .returning({ id: products.id })
      if (!row) throw new Error('Duplication échouée')
      await syncVariants(tx, row.id, variants.map(({ id: _vid, ...v }) => v))
      return row.id
    })
    return c.json(await loadProduct(store.id, id), 201)
  })
  .delete('/:id', requireRole('admin'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const [row] = await db.delete(products).where(and(eq(products.id, id), eq(products.storeId, c.get('store').id))).returning({ id: products.id })
    if (!row) throw notFound('Produit')
    return c.json({ ok: true })
  })
  .post('/bulk-active', requireRole('staff'), v('json', z.object({ ids: z.array(z.number().int()).min(1).max(500), isActive: z.boolean() })), async (c) => {
    const { ids, isActive } = c.req.valid('json')
    await db.update(products).set({ isActive }).where(and(eq(products.storeId, c.get('store').id), inArray(products.id, ids)))
    return c.json({ ok: true })
  })
