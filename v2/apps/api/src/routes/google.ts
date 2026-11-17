/**
 * Connexion / inscription avec Google (OAuth 2.0, code d'autorisation + PKCE).
 *
 *   /api/auth/google/start?next=/stores/1  → redirection vers Google
 *   /api/auth/google/callback              → retour de Google, session créée
 *
 * URI de redirection à déclarer chez Google : {APP_URL}/api/auth/google/callback
 */
import { createHash } from 'node:crypto'
import { eq, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { db } from '../db/client'
import { users } from '../db/schema'
import { createSession, hashPassword } from '../lib/auth'
import { enqueue } from '../jobs/queue'
import { recordLogin } from '../services/account'
import type { AppEnv } from '../lib/context'
import { randomToken, safeEqual } from '../lib/crypto'
import { env, isProd } from '../lib/env'
import { rateLimit } from '../lib/rate-limit'

const FLOW_COOKIE = 'zuri_oauth'
const redirectUri = () => `${env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
export const googleEnabled = () => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

/** N'accepte qu'un chemin interne (pas d'open redirect vers un autre site). */
const safeNext = (next: string | undefined) => (next && /^\/(?!\/)[\w\-/?=&%.]*$/.test(next) ? next : '/')

const back = (path: string, error?: string) => `${env.APP_URL.replace(/\/$/, '')}${error ? `/login?error=${encodeURIComponent(error)}` : path}`

interface GoogleClaims {
  iss: string
  aud: string
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  exp: number
}

function decodeIdToken(idToken: string): GoogleClaims | null {
  const part = idToken.split('.')[1]
  if (!part) return null
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as GoogleClaims
  } catch {
    return null
  }
}

export const googleRoutes = new Hono<AppEnv>()
  .get('/start', rateLimit({ key: 'google-start', limit: 30, windowSec: 600 }), (c) => {
    if (!googleEnabled()) return c.redirect(back('', 'google_disabled'))
    const state = randomToken(24)
    const verifier = randomToken(48)
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    setCookie(c, FLOW_COOKIE, JSON.stringify({ state, verifier, next: safeNext(c.req.query('next')) }), {
      httpOnly: true,
      secure: isProd,
      sameSite: 'Lax', // nécessaire : le retour de Google est une navigation depuis un autre site
      path: '/api/auth/google',
      maxAge: 600,
    })
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString()
    return c.redirect(url.toString())
  })
  .get('/callback', rateLimit({ key: 'google-cb', limit: 30, windowSec: 600 }), async (c) => {
    const raw = getCookie(c, FLOW_COOKIE)
    deleteCookie(c, FLOW_COOKIE, { path: '/api/auth/google', secure: isProd })
    if (c.req.query('error')) return c.redirect(back('', 'google_cancelled'))
    let flow: { state: string; verifier: string; next: string }
    try {
      flow = JSON.parse(raw ?? '')
    } catch {
      return c.redirect(back('', 'google_expired'))
    }
    const state = c.req.query('state') ?? ''
    const code = c.req.query('code')
    if (!code || !safeEqual(state, flow.state)) return c.redirect(back('', 'google_state'))

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
        code_verifier: flow.verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return c.redirect(back('', 'google_token'))
    const tokens = (await res.json()) as { id_token?: string }
    // Le jeton vient directement de Google (TLS + secret client) : on valide ses champs essentiels.
    const claims = tokens.id_token ? decodeIdToken(tokens.id_token) : null
    if (
      !claims ||
      claims.aud !== env.GOOGLE_CLIENT_ID ||
      !['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss) ||
      claims.exp * 1000 < Date.now() ||
      !claims.email ||
      claims.email_verified !== true
    ) {
      return c.redirect(back('', 'google_unverified'))
    }
    const email = claims.email.toLowerCase()

    // 1) compte déjà relié à Google ; 2) compte existant avec le même email (vérifié par Google) → on relie.
    let [user] = await db.select().from(users).where(eq(users.googleSub, claims.sub)).limit(1)
    if (!user) {
      ;[user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (user) {
        ;[user] = await db.update(users).set({ googleSub: claims.sub, avatarUrl: user.avatarUrl ?? claims.picture ?? null }).where(eq(users.id, user.id)).returning()
      }
    }
    // 3) nouveau compte : mêmes règles que l'inscription classique.
    let isNewAccount = false
    if (!user) {
      isNewAccount = true
      const [{ count } = { count: 0 }] = await db.select({ count: dsql<number>`count(*)::int` }).from(users)
      if (count > 0 && env.REGISTRATION_OPEN !== 'true') return c.redirect(back('', 'registration_closed'))
      ;[user] = await db
        .insert(users)
        .values({
          email,
          name: claims.name ?? email.split('@')[0]!,
          googleSub: claims.sub,
          avatarUrl: claims.picture ?? null,
          // Mot de passe inutilisable : le compte se connecte avec Google (il pourra en définir un plus tard).
          passwordHash: await hashPassword(randomToken(32)),
          isPlatformAdmin: count === 0,
        })
        .returning()
    }
    if (!user) return c.redirect(back('', 'google_failed'))
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))
    await createSession(c, user.id)
    await recordLogin(c, user, 'google', { isNewAccount })
    if (isNewAccount) await enqueue('account.notify', { userId: user.id, kind: 'welcome' })
    return c.redirect(back(flow.next))
  })
