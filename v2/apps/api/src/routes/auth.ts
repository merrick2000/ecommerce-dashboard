import { loginSchema, registerSchema, type Me } from '@zuri/shared'
import { eq, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { storeMembers, stores, users, type User } from '../db/schema'
import { createSession, destroySession, hashPassword, requireAuth, verifyPassword } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { env } from '../lib/env'
import { googleEnabled, googleRoutes } from './google'

/** Inscription ouverte ? Par défaut : seulement tant qu'aucun compte n'existe (outil perso). */
const REGISTRATION_OPEN = env.REGISTRATION_OPEN === 'true'

// Hash factice : on vérifie quand même un mot de passe si l'email est inconnu (pas de fuite par le temps de réponse).
const DUMMY_HASH = await Bun.password.hash('dummy-password-for-timing', { algorithm: 'argon2id' })

export async function loadMe(user: User): Promise<Me> {
  const rows = await db
    .select({ id: stores.id, name: stores.name, slug: stores.slug, currency: stores.currency, role: storeMembers.role })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, user.id))
    .orderBy(stores.name)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isPlatformAdmin: user.isPlatformAdmin,
    stores: rows.map((r) => ({ ...r, currency: r.currency as Me['stores'][number]['currency'] })),
  }
}

export const authRoutes = new Hono<AppEnv>()
  .post('/login', rateLimit({ key: 'login', limit: 10, windowSec: 300 }), v('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json')
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !ok) throw new HttpError(401, 'Email ou mot de passe incorrect', 'invalid_credentials')
    // Rehash progressif des anciens mots de passe bcrypt vers argon2id.
    const patch: Partial<User> = { lastLoginAt: new Date() }
    if (!user.passwordHash.startsWith('$argon2')) patch.passwordHash = await hashPassword(password)
    await db.update(users).set(patch).where(eq(users.id, user.id))
    await createSession(c, user.id)
    return c.json(await loadMe(user))
  })
  .post('/register', rateLimit({ key: 'register', limit: 5, windowSec: 3600 }), v('json', registerSchema), async (c) => {
    const input = c.req.valid('json')
    const [{ count } = { count: 0 }] = await db.select({ count: dsql<number>`count(*)::int` }).from(users)
    if (count > 0 && !REGISTRATION_OPEN) throw new HttpError(403, 'Les inscriptions sont fermées', 'registration_closed')
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
    if (exists) throw new HttpError(409, 'Un compte existe déjà avec cet email', 'email_taken')
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        phone: input.phone,
        country: input.country,
        passwordHash: await hashPassword(input.password),
        isPlatformAdmin: count === 0, // le tout premier compte administre la plateforme
      })
      .returning()
    if (!user) throw new Error('Création du compte échouée')
    await createSession(c, user.id)
    return c.json(await loadMe(user), 201)
  })
  .post('/logout', async (c) => {
    await destroySession(c)
    return c.json({ ok: true })
  })
  .get('/me', requireAuth, async (c) => c.json(await loadMe(c.get('user'))))
  /** Méthodes de connexion proposées par l'écran de login. */
  .get('/providers', (c) => c.json({ google: googleEnabled(), registrationOpen: env.REGISTRATION_OPEN === 'true' }))
  .route('/google', googleRoutes)
