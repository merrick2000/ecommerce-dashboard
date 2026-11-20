/**
 * Dépenses de la boutique (pub, emballage, salaires…) : déduites du chiffre encaissé pour le bénéfice réel.
 * Réservé à ceux qui voient le chiffre d'affaires. Un membre limité à certains produits ne voit
 * que les dépenses de ses produits.
 */
import { EXPENSE_LABELS, expenseInputSchema } from '@zuri/shared'
import { and, desc, eq, gte, inArray, lte, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { products, storeExpenses, users } from '../db/schema'
import { requirePermission } from '../lib/auth'
import type { AppEnv, StoreAccess } from '../lib/context'
import { notFound } from '../lib/errors'
import { inProductScope } from '../lib/scope'
import { v } from '../lib/validate'
import { logActivity } from '../services/activity'

const idParam = z.object({ id: z.coerce.number().int().positive() })
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const expenseScope = (access: StoreAccess) => (access.productIds ? (access.productIds.length ? inArray(storeExpenses.productId, access.productIds) : dsql`false`) : undefined)

async function assertProduct(storeId: string, access: StoreAccess, productId: string | null) {
  if (!productId) {
    // Dépense générale (sans produit) : seulement pour ceux qui voient toute la boutique.
    if (access.productIds) throw notFound('Produit')
    return
  }
  if (!inProductScope(access, productId)) throw notFound('Produit')
  const [p] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.storeId, storeId))).limit(1)
  if (!p) throw notFound('Produit')
}

export const expenseRoutes = new Hono<AppEnv>()
  .use(requirePermission('stats.revenue'))
  .get('/', v('query', z.object({ from: ymd.optional(), to: ymd.optional(), category: z.string().max(20).optional() })), async (c) => {
    const store = c.get('store')
    const { from, to, category } = c.req.valid('query')
    const where = and(
      eq(storeExpenses.storeId, store.id),
      from ? gte(storeExpenses.spentOn, from) : undefined,
      to ? lte(storeExpenses.spentOn, to) : undefined,
      category ? eq(storeExpenses.category, category as never) : undefined,
      expenseScope(c.get('access')),
    )
    const rows = await db
      .select({ e: storeExpenses, productName: products.name, author: users.name })
      .from(storeExpenses)
      .leftJoin(products, eq(products.id, storeExpenses.productId))
      .leftJoin(users, eq(users.id, storeExpenses.createdBy))
      .where(where)
      .orderBy(desc(storeExpenses.spentOn), desc(storeExpenses.id))
      .limit(1000)
    const byCategory = new Map<string, number>()
    for (const r of rows) byCategory.set(r.e.category, (byCategory.get(r.e.category) ?? 0) + Number(r.e.amount))
    return c.json({
      currency: store.currency,
      total: rows.reduce((a, r) => a + Number(r.e.amount), 0),
      byCategory: [...byCategory].map(([category, amount]) => ({ category, label: EXPENSE_LABELS[category as keyof typeof EXPENSE_LABELS] ?? category, amount })).sort((a, b) => b.amount - a.amount),
      data: rows.map((r) => ({ ...r.e, amount: Number(r.e.amount), productName: r.productName, author: r.author })),
    })
  })
  .post('/', v('json', expenseInputSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    await assertProduct(store.id, c.get('access'), input.productId)
    const [row] = await db.insert(storeExpenses).values({ ...input, storeId: store.id, createdBy: c.get('user').id }).returning()
    await logActivity(c, { entityType: 'expense', entityId: row?.id, entityLabel: input.label ?? EXPENSE_LABELS[input.category], action: 'created', message: `Dépense ajoutée (${input.amount} ${store.currency})`, productIds: input.productId ? [input.productId] : null })
    return c.json({ ...row, amount: Number(row!.amount) }, 201)
  })
  .put('/:id', v('param', idParam), v('json', expenseInputSchema), async (c) => {
    const store = c.get('store')
    const input = c.req.valid('json')
    await assertProduct(store.id, c.get('access'), input.productId)
    const [row] = await db
      .update(storeExpenses)
      .set(input)
      .where(and(eq(storeExpenses.id, c.req.valid('param').id), eq(storeExpenses.storeId, store.id), expenseScope(c.get('access'))))
      .returning()
    if (!row) throw notFound('Dépense')
    return c.json({ ...row, amount: Number(row.amount) })
  })
  .delete('/:id', v('param', idParam), async (c) => {
    const store = c.get('store')
    const [row] = await db
      .delete(storeExpenses)
      .where(and(eq(storeExpenses.id, c.req.valid('param').id), eq(storeExpenses.storeId, store.id), expenseScope(c.get('access'))))
      .returning()
    if (!row) throw notFound('Dépense')
    await logActivity(c, { entityType: 'expense', entityId: row.id, entityLabel: row.label ?? EXPENSE_LABELS[row.category], action: 'deleted', message: 'Dépense supprimée' })
    return c.json({ ok: true })
  })
