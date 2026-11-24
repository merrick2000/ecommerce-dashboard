import { customerIdSchema } from '@zuri/shared'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { customers, orders } from '../db/schema'
import { requirePermission } from '../lib/auth'
import { customerScope, orderScope } from '../lib/scope'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { normalizePhone } from '../services/orders'

const idParam = z.object({ id: customerIdSchema })

export const customerRoutes = new Hono<AppEnv>()
  .get('/', requirePermission('customers.view'), v('query', z.object({ q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1) })), async (c) => {
    const { q, page } = c.req.valid('query')
    const conds = [eq(customers.storeId, c.get('store').id)]
    const scope = customerScope(c.get('access'))
    if (scope) conds.push(scope)
    if (q) {
      const like = `%${q.replace(/[%_]/g, '\\$&')}%`
      conds.push(or(ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.email, like), ilike(customers.city, like))!)
    }
    const where = and(...conds)
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db.select().from(customers).where(where).orderBy(desc(customers.updatedAt)).limit(50).offset((page - 1) * 50),
      db.select({ total: count() }).from(customers).where(where),
    ])
    return c.json({ data: rows, total, page, pageSize: 50 })
  })
  /** Export CSV de tous les clients (périmètre du membre respecté) : vos données vous appartiennent. */
  .get('/export.csv', requirePermission('customers.view', 'orders.export'), async (c) => {
    const store = c.get('store')
    const conds = [eq(customers.storeId, store.id)]
    const scope = customerScope(c.get('access'))
    if (scope) conds.push(scope)
    const rows = await db.select().from(customers).where(and(...conds)).orderBy(desc(customers.updatedAt)).limit(50_000)
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      // Neutralise l'injection de formules dans Excel/Sheets.
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
      return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
    }
    const header = ['Nom', 'Téléphone', 'Email', 'Ville', 'Adresse', 'Commandes', 'Livrées', 'Retournées', 'Total dépensé', 'Bloqué', 'Client depuis']
    const lines = rows.map((r) => [r.name, r.phone, r.email, r.city, r.address, r.ordersCount, r.deliveredCount, r.returnedCount, r.totalSpent, r.isBlocked ? 'oui' : 'non', r.createdAt.toISOString().slice(0, 10)].map(esc).join(';'))
    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="clients-${store.slug}.csv"`)
    return c.body(`\ufeff${[header.join(';'), ...lines].join('\n')}`)
  })
  .get('/:id', requirePermission('customers.view'), v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.storeId, c.get('store').id), customerScope(c.get('access')))).limit(1)
    if (!customer) throw notFound('Client')
    const history = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, currency: orders.currency, paymentStatus: orders.paymentStatus, fulfillmentStatus: orders.fulfillmentStatus, createdAt: orders.createdAt })
      .from(orders)
      .where(and(eq(orders.customerId, id), orderScope(c.get('access'))))
      .orderBy(desc(orders.createdAt))
      .limit(100)
    return c.json({ ...customer, orders: history })
  })
  .patch('/:id', requirePermission('customers.edit'), v('param', idParam), v('json', z.object({ isBlocked: z.boolean().optional(), notes: z.string().max(2000).nullable().optional(), name: z.string().max(120).optional(), email: z.string().email().nullable().optional(), city: z.string().max(120).nullable().optional(), address: z.string().max(500).nullable().optional(), phone: z.string().trim().min(6).max(25).optional() })), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db
      .update(customers)
      .set({ ...body, ...(body.phone ? { phone: normalizePhone(body.phone) } : {}) })
      .where(and(eq(customers.id, c.req.valid('param').id), eq(customers.storeId, c.get('store').id), customerScope(c.get('access'))))
      .returning()
    if (!row) throw notFound('Client')
    return c.json(row)
  })
