import { and, eq, gt } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { sessions, storeMemberProducts, storeMembers, stores, users } from '../db/schema'
import type { AppEnv, StoreAccess } from './context'
import { randomToken, sha256 } from './crypto'
import { isProd } from './env'
import { forbidden, HttpError, notFound } from './errors'
import { FULL_SCOPE_ROLES, permissionsFor, STORE_ROLES, storeIdSchema, type Permission } from '@zuri/shared'

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

/**
 * Résout la boutique depuis `:storeId` et charge les droits du membre (rôle, options, périmètre produits).
 * Toute route `/stores/:storeId/*` passe par ici : l'isolation entre boutiques
 * n'est jamais laissée à chaque handler.
 */
export const requireStore = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const storeId = c.req.param('storeId') ?? ''
    if (!storeIdSchema.safeParse(storeId).success) throw notFound('Boutique')
    const user = c.get('user')
    const [row] = await db
      .select({ store: stores, member: storeMembers })
      .from(stores)
      .leftJoin(storeMembers, and(eq(storeMembers.storeId, stores.id), eq(storeMembers.userId, user.id)))
      .where(eq(stores.id, storeId))
      .limit(1)
    if (!row) throw notFound('Boutique')
    const access = await loadAccess(storeId, user.id, row.member, user.isPlatformAdmin)
    if (!access) throw notFound('Boutique')
    c.set('store', row.store)
    c.set('role', access.role)
    c.set('access', access)
    await next()
  })

type MemberRow = typeof storeMembers.$inferSelect

/** Droits effectifs d'un utilisateur sur une boutique (null = aucun accès). */
export async function loadAccess(storeId: string, userId: number, member: MemberRow | null, isPlatformAdmin = false): Promise<StoreAccess | null> {
  if (!member) {
    if (!isPlatformAdmin) return null
    return { userId, role: 'owner', permissions: new Set(permissionsFor('owner')), productIds: null }
  }
  const role = (STORE_ROLES as readonly string[]).includes(member.role) ? member.role : 'closer'
  let productIds: string[] | null = null
  if (!FULL_SCOPE_ROLES.includes(role) && !member.allProducts) {
    const rows = await db
      .select({ productId: storeMemberProducts.productId })
      .from(storeMemberProducts)
      .where(and(eq(storeMemberProducts.storeId, storeId), eq(storeMemberProducts.userId, userId)))
    productIds = rows.map((r) => r.productId)
  }
  return { userId, role, permissions: new Set(permissionsFor(role, member.options)), productIds }
}

export const can = (access: StoreAccess, permission: Permission) => access.permissions.has(permission)

/** Exige une ou plusieurs permissions sur la boutique courante. */
export const requirePermission = (...needed: Permission[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const access = c.get('access')
    if (!needed.every((p) => access.permissions.has(p))) throw forbidden('Vous n’avez pas accès à cette action')
    await next()
  })
