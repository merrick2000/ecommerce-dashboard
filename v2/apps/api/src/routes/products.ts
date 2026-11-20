import { productIdSchema, productInputSchema, type ProductInput } from '@zuri/shared'
import { and, asc, desc, eq, inArray, notInArray, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { assertWithinLimit, planForStore } from '../services/platform'
import { z } from 'zod'
import { db, type Tx } from '../db/client'
import { orderItems, orders, productVariants, products, storeMemberProducts, type Product } from '../db/schema'
import { can, requirePermission } from '../lib/auth'
import type { StoreAccess } from '../lib/context'
import { inProductScope, productScope } from '../lib/scope'
import { logActivity } from '../services/activity'
import { addToScope, assertStoreKind, createProduct, syncVariants, toRow } from '../services/product-write'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { sanitizeHtml } from '../lib/sanitize'
import { v } from '../lib/validate'
import { displayPrice } from '../services/pricing'
import { publicUrl } from '../services/storage'

const idParam = z.object({ id: productIdSchema })

function assertScope(access: StoreAccess, id: string) {
  if (!inProductScope(access, id)) throw notFound('Produit')
}

async function loadProduct(storeId: string, id: string) {
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
  .get('/', requirePermission('products.view'), async (c) => {
    const store = c.get('store')
    const access = c.get('access')
    const showRevenue = can(access, 'stats.revenue')
    const rows = await db
      .select({
        product: products,
        sales: dsql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.paymentStatus} = 'paid' or ${orders.fulfillmentStatus} = 'delivered'), 0)::int`,
        revenue: dsql<number>`coalesce(sum(${orderItems.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)::float`,
        pending: dsql<number>`count(${orders.id}) filter (where ${orders.fulfillmentStatus} in ('new','unreachable'))::int`,
        variantStock: dsql<number | null>`(select sum(${productVariants.stock})::int from ${productVariants} where "product_variants"."product_id" = "products"."id" and "product_variants"."is_active")`,
        variantCount: dsql<number>`(select count(*)::int from ${productVariants} where "product_variants"."product_id" = "products"."id")`,
      })
      .from(products)
      .leftJoin(orderItems, eq(orderItems.productId, products.id))
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(products.storeId, store.id), productScope(access)))
      .groupBy(products.id)
      .orderBy(desc(products.createdAt))
    return c.json(
      rows.map(({ product, ...stats }) => ({
        id: product.id,
        type: product.type,
        paymentMethod: product.payment.method,
        name: product.name,
        isActive: product.isActive,
        thumbnail: publicUrl(product.thumbnail ?? product.coverImage),
        stock: product.stock,
        trackInventory: product.trackInventory,
        price: displayPrice(product, store.currency),
        createdAt: product.createdAt,
        ...stats,
        revenue: showRevenue ? stats.revenue : null,
      })),
    )
  })
  .get('/:id', requirePermission('products.view'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    assertScope(c.get('access'), id)
    return c.json(await loadProduct(c.get('store').id, id))
  })
  .post('/', requirePermission('products.edit'), v('json', productInputSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    const [{ n } = { n: 0 }] = await db.select({ n: dsql<number>`count(*)::int` }).from(products).where(eq(products.storeId, store.id))
    assertWithinLimit(await planForStore(store.id), 'products', n)
    const id = await createProduct(c.get('access'), store, input)
    await logActivity(c, { entityType: 'product', entityId: id, entityLabel: input.name, action: 'created', message: 'Produit créé', productIds: [id] })
    return c.json(await loadProduct(store.id, id), 201)
  })
  .put('/:id', requirePermission('products.edit'), v('param', idParam), v('json', productInputSchema), async (c) => {
    const store = c.get('store')
    const { id } = c.req.valid('param')
    assertScope(c.get('access'), id)
    const input = c.req.valid('json')
    const existing = await loadProduct(store.id, id)
    // Les anciens produits d'un autre type restent modifiables, mais un produit ne change pas de type vers le mauvais.
    if (input.type !== existing.type) assertStoreKind(store, input.type)
    await db.transaction(async (tx) => {
      // La devise de base ne change pas silencieusement quand la boutique change de devise.
      await tx.update(products).set(toRow(input, store.id, existing.baseCurrency)).where(eq(products.id, id))
      await syncVariants(tx, id, input.variants)
    })
    const changes: string[] = []
    if (existing.price !== input.price) changes.push(`prix ${existing.price} → ${input.price}`)
    if (existing.isActive !== input.isActive) changes.push(input.isActive ? 'activé' : 'désactivé')
    if (existing.name !== input.name) changes.push('nom modifié')
    await logActivity(c, { entityType: 'product', entityId: id, entityLabel: input.name, action: 'updated', message: changes.length ? `Produit modifié (${changes.join(', ')})` : 'Produit modifié', productIds: [id] })
    return c.json(await loadProduct(store.id, id))
  })
  .patch('/:id/active', requirePermission('products.edit'), v('param', idParam), v('json', z.object({ isActive: z.boolean() })), async (c) => {
    const { id } = c.req.valid('param')
    assertScope(c.get('access'), id)
    const [row] = await db
      .update(products)
      .set({ isActive: c.req.valid('json').isActive })
      .where(and(eq(products.id, id), eq(products.storeId, c.get('store').id)))
      .returning({ id: products.id, isActive: products.isActive, name: products.name })
    if (!row) throw notFound('Produit')
    await logActivity(c, { entityType: 'product', entityId: id, entityLabel: row.name, action: row.isActive ? 'activated' : 'deactivated', message: row.isActive ? 'Produit activé' : 'Produit désactivé', productIds: [id] })
    return c.json({ id: row.id, isActive: row.isActive })
  })
  .post('/:id/duplicate', requirePermission('products.edit'), v('param', idParam), async (c) => {
    const store = c.get('store')
    assertScope(c.get('access'), c.req.valid('param').id)
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
    await addToScope(c.get('access'), store.id, id)
    await logActivity(c, { entityType: 'product', entityId: id, entityLabel: `${src.name} (copie)`, action: 'duplicated', message: `Produit dupliqué depuis « ${src.name} »`, productIds: [id] })
    return c.json(await loadProduct(store.id, id), 201)
  })
  .delete('/:id', requirePermission('products.edit'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    assertScope(c.get('access'), id)
    const [row] = await db.delete(products).where(and(eq(products.id, id), eq(products.storeId, c.get('store').id))).returning({ id: products.id, name: products.name })
    if (!row) throw notFound('Produit')
    await logActivity(c, { entityType: 'product', entityId: null, entityLabel: row.name, action: 'deleted', message: 'Produit supprimé', productIds: [id] })
    return c.json({ ok: true })
  })
  .post('/bulk-active', requirePermission('products.edit'), v('json', z.object({ ids: z.array(productIdSchema).min(1).max(500), isActive: z.boolean() })), async (c) => {
    const { ids, isActive } = c.req.valid('json')
    for (const id of ids) assertScope(c.get('access'), id)
    await db.update(products).set({ isActive }).where(and(eq(products.storeId, c.get('store').id), inArray(products.id, ids)))
    await logActivity(c, { entityType: 'product', action: isActive ? 'activated' : 'deactivated', message: `${ids.length} produit(s) ${isActive ? 'activé(s)' : 'désactivé(s)'}`, productIds: ids })
    return c.json({ ok: true })
  })
