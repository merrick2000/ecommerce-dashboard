/**
 * Clés API personnelles (pour Claude, ChatGPT, MCP, n8n…). Gérées uniquement depuis une session :
 * une clé ne peut ni créer ni révoquer d'autres clés.
 */
import { and, desc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { apiKeys, storeMembers, stores } from '../db/schema'
import { API_KEY_PREFIX, requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { randomToken, sha256 } from '../lib/crypto'
import { HttpError, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { storeIdSchema } from '@zuri/shared'

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  storeId: storeIdSchema.nullable().default(null),
  scope: z.enum(['read', 'write']).default('write'),
})

const MAX_KEYS = 20

export const apiKeyRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(async (c, next) => {
    if (c.get('apiKey')) throw new HttpError(403, 'Les clés API se gèrent depuis le tableau de bord', 'api_key_forbidden')
    await next()
  })
  .get('/', async (c) => {
    const rows = await db
      .select({ key: apiKeys, storeName: stores.name })
      .from(apiKeys)
      .leftJoin(stores, eq(stores.id, apiKeys.storeId))
      .where(and(eq(apiKeys.userId, c.get('user').id), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt))
    return c.json(
      rows.map(({ key, storeName }) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scope: key.scope,
        storeId: key.storeId,
        storeName,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
      })),
    )
  })
  .post('/', v('json', createSchema), async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    if (input.storeId) {
      const [m] = await db.select({ id: storeMembers.storeId }).from(storeMembers).where(and(eq(storeMembers.storeId, input.storeId), eq(storeMembers.userId, user.id))).limit(1)
      if (!m) throw notFound('Boutique')
    }
    const active = await db.select({ id: apiKeys.id }).from(apiKeys).where(and(eq(apiKeys.userId, user.id), isNull(apiKeys.revokedAt)))
    if (active.length >= MAX_KEYS) throw new HttpError(409, `${MAX_KEYS} clés actives maximum : révoque celles que tu n’utilises plus.`, 'too_many_keys')
    const key = `${API_KEY_PREFIX}${randomToken(32)}`
    const [row] = await db
      .insert(apiKeys)
      .values({ userId: user.id, storeId: input.storeId, name: input.name, scope: input.scope, prefix: key.slice(0, 16), keyHash: sha256(key) })
      .returning()
    // La clé complète n'est renvoyée qu'ici, une seule fois.
    return c.json({ id: row!.id, name: row!.name, prefix: row!.prefix, scope: row!.scope, storeId: row!.storeId, key }, 201)
  })
  .delete('/:id', v('param', z.object({ id: z.coerce.number().int().positive() })), async (c) => {
    const [row] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, c.req.valid('param').id), eq(apiKeys.userId, c.get('user').id), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id })
    if (!row) throw notFound('Clé')
    return c.json({ ok: true })
  })
