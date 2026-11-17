import { deliveryZoneInputSchema } from '@zuri/shared'
import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { deliveryZones } from '../db/schema'
import { requirePermission } from '../lib/auth'
import { logActivity } from '../services/activity'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { v } from '../lib/validate'

const idParam = z.object({ id: z.coerce.number().int().positive() })

export const zoneRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await db.select().from(deliveryZones).where(eq(deliveryZones.storeId, c.get('store').id)).orderBy(asc(deliveryZones.position), asc(deliveryZones.name))))
  .post('/', requirePermission('delivery.edit'), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db.insert(deliveryZones).values({ ...c.req.valid('json'), storeId: c.get('store').id }).returning()
    await logActivity(c, { entityType: 'zone', entityId: row?.id, entityLabel: row?.name, action: 'created', message: 'Zone de livraison créée' })
    return c.json(row, 201)
  })
  .put('/:id', requirePermission('delivery.edit'), v('param', idParam), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db
      .update(deliveryZones)
      .set(c.req.valid('json'))
      .where(and(eq(deliveryZones.id, c.req.valid('param').id), eq(deliveryZones.storeId, c.get('store').id)))
      .returning()
    if (!row) throw notFound('Zone')
    await logActivity(c, { entityType: 'zone', entityId: row.id, entityLabel: row.name, action: 'updated', message: `Zone de livraison modifiée (frais ${row.fee})` })
    return c.json(row)
  })
  .delete('/:id', requirePermission('delivery.edit'), v('param', idParam), async (c) => {
    const [row] = await db
      .delete(deliveryZones)
      .where(and(eq(deliveryZones.id, c.req.valid('param').id), eq(deliveryZones.storeId, c.get('store').id)))
      .returning({ id: deliveryZones.id, name: deliveryZones.name })
    if (!row) throw notFound('Zone')
    await logActivity(c, { entityType: 'zone', entityLabel: row.name, action: 'deleted', message: 'Zone de livraison supprimée' })
    return c.json({ ok: true })
  })
