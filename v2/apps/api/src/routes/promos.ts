import { promoCodeInputSchema } from '@zuri/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { promoCodes } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { conflict, notFound } from '../lib/errors'
import { v } from '../lib/validate'

const idParam = z.object({ id: z.coerce.number().int().positive() })

async function assertCodeFree(storeId: number, code: string, exceptId?: number) {
  const [hit] = await db.select({ id: promoCodes.id }).from(promoCodes).where(and(eq(promoCodes.storeId, storeId), eq(promoCodes.code, code))).limit(1)
  if (hit && hit.id !== exceptId) throw conflict('Ce code existe déjà', 'code_taken')
}

export const promoRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await db.select().from(promoCodes).where(eq(promoCodes.storeId, c.get('store').id)).orderBy(desc(promoCodes.createdAt))))
  .post('/', requireRole('admin'), v('json', promoCodeInputSchema), async (c) => {
    const input = c.req.valid('json')
    await assertCodeFree(c.get('store').id, input.code)
    const [row] = await db.insert(promoCodes).values({ ...input, storeId: c.get('store').id }).returning()
    return c.json(row, 201)
  })
  .put('/:id', requireRole('admin'), v('param', idParam), v('json', promoCodeInputSchema), async (c) => {
    const input = c.req.valid('json')
    const { id } = c.req.valid('param')
    await assertCodeFree(c.get('store').id, input.code, id)
    const [row] = await db.update(promoCodes).set(input).where(and(eq(promoCodes.id, id), eq(promoCodes.storeId, c.get('store').id))).returning()
    if (!row) throw notFound('Code promo')
    return c.json(row)
  })
  .delete('/:id', requireRole('admin'), v('param', idParam), async (c) => {
    const [row] = await db
      .delete(promoCodes)
      .where(and(eq(promoCodes.id, c.req.valid('param').id), eq(promoCodes.storeId, c.get('store').id)))
      .returning({ id: promoCodes.id })
    if (!row) throw notFound('Code promo')
    return c.json({ ok: true })
  })
