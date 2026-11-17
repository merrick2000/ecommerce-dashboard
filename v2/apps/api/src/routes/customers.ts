import { customerIdSchema } from '@zuri/shared'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { customers, orders } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { normalizePhone } from '../services/orders'

const idParam = z.object({ id: customerIdSchema })

export const customerRoutes = new Hono<AppEnv>()
  .get('/', v('query', z.object({ q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1) })), async (c) => {
    const { q, page } = c.req.valid('query')
    const conds = [eq(customers.storeId, c.get('store').id)]
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
  .get('/:id', v('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.storeId, c.get('store').id))).limit(1)
    if (!customer) throw notFound('Client')
    const history = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, currency: orders.currency, paymentStatus: orders.paymentStatus, fulfillmentStatus: orders.fulfillmentStatus, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(100)
    return c.json({ ...customer, orders: history })
  })
  .patch('/:id', requireRole('staff'), v('param', idParam), v('json', z.object({ isBlocked: z.boolean().optional(), notes: z.string().max(2000).nullable().optional(), name: z.string().max(120).optional(), email: z.string().email().nullable().optional(), city: z.string().max(120).nullable().optional(), address: z.string().max(500).nullable().optional(), phone: z.string().trim().min(6).max(25).optional() })), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db
      .update(customers)
      .set({ ...body, ...(body.phone ? { phone: normalizePhone(body.phone) } : {}) })
      .where(and(eq(customers.id, c.req.valid('param').id), eq(customers.storeId, c.get('store').id)))
      .returning()
    if (!row) throw notFound('Client')
    return c.json(row)
  })
