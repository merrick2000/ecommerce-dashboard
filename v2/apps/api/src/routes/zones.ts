import { deliveryZoneInputSchema } from '@zuri/shared'
import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { deliveryZones } from '../db/schema'
import { can, requirePermission } from '../lib/auth'
import { logActivity } from '../services/activity'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { v } from '../lib/validate'

const idParam = z.object({ id: z.coerce.number().int().positive() })

export const zoneRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await db.select().from(deliveryZones).where(eq(deliveryZones.storeId, c.get('store').id)).orderBy(asc(deliveryZones.position), asc(deliveryZones.name))
    // Coûts réels du livreur : réservés à ceux qui voient le chiffre d'affaires.
    return c.json(can(c.get('access'), 'stats.revenue') ? rows : rows.map((z) => ({ ...z, courierCost: null, returnCost: null })))
  })
  .post('/', requirePermission('delivery.edit'), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db.insert(deliveryZones).values({ ...c.req.valid('json'), storeId: c.get('store').id }).returning()
    await logActivity(c, { entityType: 'zone', entityId: row?.id, entityLabel: row?.name, action: 'created', message: 'Zone de livraison créée' })
    return c.json(row, 201)
  })
  /** Nouvel ordre d'affichage (glisser-déposer) : position = rang dans la liste. */
  .put('/order', requirePermission('delivery.edit'), v('json', z.object({ ids: z.array(z.number().int().positive()).max(500) })), async (c) => {
    const storeId = c.get('store').id
    const { ids } = c.req.valid('json')
    await db.transaction(async (tx) => {
      for (const [position, id] of ids.entries()) {
        await tx.update(deliveryZones).set({ position }).where(and(eq(deliveryZones.id, id), eq(deliveryZones.storeId, storeId)))
      }
    })
    await logActivity(c, { entityType: 'zone', action: 'reordered', message: 'Ordre des zones de livraison modifié' })
    return c.json({ ok: true })
  })
  .put('/:id', requirePermission('delivery.edit'), v('param', idParam), v('json', deliveryZoneInputSchema), async (c) => {
    const [row] = await db
      .update(deliveryZones)
      .set(
        (() => {
          // Sans accès aux coûts, la modification ne les touche pas (le formulaire les reçoit vides).
          const { courierCost, returnCost, ...rest } = c.req.valid('json')
          return can(c.get('access'), 'stats.revenue') ? { ...rest, courierCost, returnCost } : rest
        })(),
      )
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
