import { and, eq, gt } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { sessions, storeMembers, stores, users } from '../db/schema'
import type { AppEnv } from './context'
import { randomToken, sha256 } from './crypto'
import { isProd } from './env'
import { forbidden, HttpError, notFound } from './errors'
import type { StoreRole } from '@zuri/shared'

export const SESSION_COOKIE = isProd ? '__Host-zuri_session' : 'zuri_session'
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000
const RENEW_BEFORE_MS = 15 * 24 * 3600 * 1000

export async function hashPassword(password: string) {
  return Bun.password.hash(password, { algorithm: 'argon2id' })
}

/** Accepte bcrypt ($2y$ de Laravel) et argon2id. */
export async function verifyPassword(password: string, hash: string) {
  return Bun.password.verify(password, hash.replace(/^\$2y\$/, '$2b$'))
}

export async function createSession(c: Context, userId: number) {
  const token = randomToken(32)
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: c.req.header('user-agent')?.slice(0, 512),
  })
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function destroySession(c: Context) {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)))
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: isProd })
}

/** Exige une session valide ; prolonge la session si elle approche de l'expiration. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) throw new HttpError(401, 'Non connecté', 'unauthenticated')
  const sid = sha256(token)
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sid), gt(sessions.expiresAt, new Date())))
    .limit(1)
  if (!row) {
    deleteCookie(c, SESSION_COOKIE, { path: '/', secure: isProd })
    throw new HttpError(401, 'Session expirée', 'unauthenticated')
  }
  if (row.expiresAt.getTime() - Date.now() < RENEW_BEFORE_MS) {
    await db.update(sessions).set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) }).where(eq(sessions.id, sid))
  }
  c.set('user', row.user)
  c.set('sessionId', sid)
  await next()
})

const ROLE_RANK: Record<StoreRole, number> = { confirmer: 1, staff: 2, admin: 3, owner: 4 }

/**
 * Résout la boutique depuis `:storeId` et vérifie l'appartenance.
 * Toute route `/stores/:storeId/*` passe par ici : l'isolation entre boutiques
 * n'est jamais laissée à chaque handler.
 */
export const requireStore = (minRole: StoreRole = 'confirmer') =>
  createMiddleware<AppEnv>(async (c, next) => {
    const storeId = Number(c.req.param('storeId'))
    if (!Number.isInteger(storeId)) throw notFound('Boutique')
    const user = c.get('user')
    const [row] = await db
      .select({ store: stores, role: storeMembers.role })
      .from(stores)
      .leftJoin(storeMembers, and(eq(storeMembers.storeId, stores.id), eq(storeMembers.userId, user.id)))
      .where(eq(stores.id, storeId))
      .limit(1)
    if (!row) throw notFound('Boutique')
    const role: StoreRole | null = row.role ?? (user.isPlatformAdmin ? 'owner' : null)
    if (!role) throw notFound('Boutique')
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) throw forbidden('Rôle insuffisant pour cette action')
    c.set('store', row.store)
    c.set('role', role)
    await next()
  })

export const requireRole = (minRole: StoreRole) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (ROLE_RANK[c.get('role')] < ROLE_RANK[minRole]) throw forbidden('Rôle insuffisant pour cette action')
    await next()
  })
