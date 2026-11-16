import { deliveryZoneInputSchema } from '@sellit/shared'
import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { deliveryZones } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { v } from '../lib/validate'

const idParam = z.object({ id: z.coerce.number().int().positive() })

export const zoneRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await db.select().from(deliveryZones).where(eq(deliveryZones.storeId, c.get('store').id)).orderBy(asc(deliveryZones.position), asc(deliveryZones.name))))
  .post('/', requireRole('admin'), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db.insert(deliveryZones).values({ ...c.req.valid('json'), storeId: c.get('store').id }).returning()
    return c.json(row, 201)
  })
  .put('/:id', requireRole('admin'), v('param', idParam), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db
      .update(deliveryZones)
      .set(c.req.valid('json'))
      .where(and(eq(deliveryZones.id, c.req.valid('param').id), eq(deliveryZones.storeId, c.get('store').id)))
      .returning()
    if (!row) throw notFound('Zone')
    return c.json(row)
  })
  .delete('/:id', requireRole('admin'), v('param', idParam), async (c) => {
    const [row] = await db
      .delete(deliveryZones)
      .where(and(eq(deliveryZones.id, c.req.valid('param').id), eq(deliveryZones.storeId, c.get('store').id)))
      .returning({ id: deliveryZones.id })
    if (!row) throw notFound('Zone')
    return c.json({ ok: true })
  })
