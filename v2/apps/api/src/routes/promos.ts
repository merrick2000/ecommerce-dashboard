import { promoCodeInputSchema } from '@zuri/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { promoCodes } from '../db/schema'
import { requirePermission } from '../lib/auth'
import { logActivity } from '../services/activity'
import type { AppEnv } from '../lib/context'
import { conflict, notFound } from '../lib/errors'
import { v } from '../lib/validate'

const idParam = z.object({ id: z.coerce.number().int().positive() })

async function assertCodeFree(storeId: string, code: string, exceptId?: number) {
  const [hit] = await db.select({ id: promoCodes.id }).from(promoCodes).where(and(eq(promoCodes.storeId, storeId), eq(promoCodes.code, code))).limit(1)
  if (hit && hit.id !== exceptId) throw conflict('Ce code existe déjà', 'code_taken')
}

export const promoRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await db.select().from(promoCodes).where(eq(promoCodes.storeId, c.get('store').id)).orderBy(desc(promoCodes.createdAt))))
  .post('/', requirePermission('marketing.edit'), v('json', promoCodeInputSchema), async (c) => {
    const input = c.req.valid('json')
    await assertCodeFree(c.get('store').id, input.code)
    const [row] = await db.insert(promoCodes).values({ ...input, storeId: c.get('store').id }).returning()
    await logActivity(c, { entityType: 'promo', entityId: row?.id, entityLabel: input.code, action: 'created', message: 'Code promo créé' })
    return c.json(row, 201)
  })
  .put('/:id', requirePermission('marketing.edit'), v('param', idParam), v('json', promoCodeInputSchema), async (c) => {
    const input = c.req.valid('json')
    const { id } = c.req.valid('param')
    await assertCodeFree(c.get('store').id, input.code, id)
    const [row] = await db.update(promoCodes).set(input).where(and(eq(promoCodes.id, id), eq(promoCodes.storeId, c.get('store').id))).returning()
    if (!row) throw notFound('Code promo')
    await logActivity(c, { entityType: 'promo', entityId: row.id, entityLabel: row.code, action: 'updated', message: 'Code promo modifié' })
    return c.json(row)
  })
  .delete('/:id', requirePermission('marketing.edit'), v('param', idParam), async (c) => {
    const [row] = await db
      .delete(promoCodes)
      .where(and(eq(promoCodes.id, c.req.valid('param').id), eq(promoCodes.storeId, c.get('store').id)))
      .returning({ id: promoCodes.id, code: promoCodes.code })
    if (!row) throw notFound('Code promo')
    await logActivity(c, { entityType: 'promo', entityLabel: row.code, action: 'deleted', message: 'Code promo supprimé' })
    return c.json({ ok: true })
  })
