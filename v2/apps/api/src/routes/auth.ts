import { forgotPasswordSchema, inviteRegisterSchema, loginSchema, registerSchema, resetPasswordSchema, type Me } from '@zuri/shared'
import { and, eq, gt, isNull, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { passwordResets, sessions, storeMembers, stores, users, type User } from '../db/schema'
import { createSession, destroySession, hashPassword, loadAccess, requireAuth, verifyPassword } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { env } from '../lib/env'
import { googleEnabled, googleRoutes } from './google'
import { sha256 } from '../lib/crypto'
import { enqueue } from '../jobs/queue'
import { loginContext, recordLogin, sendPasswordReset } from '../services/account'
import { acceptInvitation, previewInvitation } from '../services/team'

/** Inscription ouverte à tous ? (lu à chaque appel). « false » : seul le premier compte, outil perso. */
const registrationOpen = () => env.REGISTRATION_OPEN !== 'false'

// Hash factice : on vérifie quand même un mot de passe si l'email est inconnu (pas de fuite par le temps de réponse).
const DUMMY_HASH = await Bun.password.hash('dummy-password-for-timing', { algorithm: 'argon2id' })

export async function loadMe(user: User): Promise<Me> {
  const rows = await db
    .select({ id: stores.id, name: stores.name, slug: stores.slug, currency: stores.currency, member: storeMembers })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, user.id))
    .orderBy(stores.name)
  const list = await Promise.all(
    rows.map(async ({ member, ...r }) => {
      const access = (await loadAccess(r.id, user.id, member))!
      return { ...r, currency: r.currency as Me['stores'][number]['currency'], role: access.role, permissions: [...access.permissions], productIds: access.productIds }
    }),
  )
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isPlatformAdmin: user.isPlatformAdmin,
    stores: list,
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
    await recordLogin(c, user, 'password')
    return c.json(await loadMe(user))
  })
  .post('/register', rateLimit({ key: 'register', limit: 5, windowSec: 3600 }), v('json', registerSchema), async (c) => {
    const input = c.req.valid('json')
    const [{ count } = { count: 0 }] = await db.select({ count: dsql<number>`count(*)::int` }).from(users)
    if (count > 0 && !registrationOpen()) throw new HttpError(403, 'Les inscriptions sont fermées', 'registration_closed')
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
        lastLoginAt: new Date(),
      })
      .returning()
    if (!user) throw new Error('Création du compte échouée')
    await createSession(c, user.id)
    await recordLogin(c, user, 'password', { isNewAccount: true })
    await enqueue('account.notify', { userId: user.id, kind: 'welcome' })
    return c.json(await loadMe(user), 201)
  })
  /** Inscription via une invitation d'équipe : l'email est celui de l'invitation, inscriptions fermées ou non. */
  .post('/register-invite', rateLimit({ key: 'register', limit: 5, windowSec: 3600 }), v('json', inviteRegisterSchema), async (c) => {
    const input = c.req.valid('json')
    const preview = await previewInvitation(input.token)
    if (!preview || preview.expired || preview.accepted) throw new HttpError(400, 'Cette invitation n’est plus valable. Demandez-en une nouvelle.', 'invite_invalid')
    if (preview.hasAccount) throw new HttpError(409, 'Un compte existe déjà avec cet email : connectez-vous pour rejoindre l’équipe.', 'email_taken')
    const [user] = await db.insert(users).values({ email: preview.email, name: input.name, passwordHash: await hashPassword(input.password), lastLoginAt: new Date() }).returning()
    if (!user) throw new Error('Création du compte échouée')
    await acceptInvitation(user, input.token)
    await createSession(c, user.id)
    await recordLogin(c, user, 'password', { isNewAccount: true })
    return c.json(await loadMe(user), 201)
  })
  /**
   * Mot de passe oublié : réponse identique que le compte existe ou non (pas d'énumération des emails).
   * L'envoi n'est pas attendu, pour que le temps de réponse ne trahisse rien non plus.
   */
  .post('/password/forgot', rateLimit({ key: 'forgot', limit: 5, windowSec: 900 }), v('json', forgotPasswordSchema), async (c) => {
    const { email } = c.req.valid('json')
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (user) void sendPasswordReset(user).catch((err) => console.error('[password/forgot]', err))
    return c.json({ ok: true })
  })
  .post('/password/reset', rateLimit({ key: 'reset', limit: 10, windowSec: 900 }), v('json', resetPasswordSchema), async (c) => {
    const { token, password } = c.req.valid('json')
    const passwordHash = await hashPassword(password)
    // Consommation atomique : un lien ne sert qu'une fois, même avec deux clics simultanés.
    const [reset] = await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.id, sha256(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
      .returning({ userId: passwordResets.userId })
    if (!reset) throw new HttpError(400, 'Ce lien n’est plus valable. Demandez-en un nouveau.', 'reset_invalid')
    const [user] = await db.update(users).set({ passwordHash, lastLoginAt: new Date() }).where(eq(users.id, reset.userId)).returning()
    if (!user) throw new HttpError(400, 'Ce lien n’est plus valable. Demandez-en un nouveau.', 'reset_invalid')
    // Toutes les sessions existantes tombent (un intrus éventuel est déconnecté), les autres liens aussi.
    await db.delete(sessions).where(eq(sessions.userId, user.id))
    await db.delete(passwordResets).where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)))
    await createSession(c, user.id)
    await recordLogin(c, user, 'reset')
    await enqueue('account.notify', { userId: user.id, kind: 'password-changed', userAgent: loginContext(c).userAgent, at: new Date().toISOString() })
    return c.json(await loadMe(user))
  })
  .post('/logout', async (c) => {
    await destroySession(c)
    return c.json({ ok: true })
  })
  .get('/me', requireAuth, async (c) => c.json(await loadMe(c.get('user'))))
  /** Méthodes de connexion proposées par l'écran de login. */
  .get('/providers', (c) => c.json({ google: googleEnabled(), registrationOpen: registrationOpen() }))
  .route('/google', googleRoutes)
