/**
 * Emails et sécurité du compte : appareils connus (alerte de nouvelle connexion),
 * liens « mot de passe oublié », bienvenue.
 */
import { timezoneForCountry } from '@zuri/shared'
import { and, eq, gt, isNull, ne } from 'drizzle-orm'
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { db } from '../db/client'
import { passwordResets, userDevices, type User } from '../db/schema'
import { randomToken, sha256 } from '../lib/crypto'
import { env, isProd } from '../lib/env'
import { clientIp } from '../lib/rate-limit'
import { enqueue } from '../jobs/queue'
import { newLoginEmail, passwordChangedEmail, passwordResetEmail, welcomeEmail } from './emails'
import { sendEmail } from './notify'

export const DEVICE_COOKIE = isProd ? '__Host-zuri_device' : 'zuri_device'
const DEVICE_MAX_AGE_S = 400 * 24 * 3600
export const RESET_TTL_MIN = 30

/** Les emails de compte partent de « Zuri <compte@domaine> ». */
const ACCOUNT_MAIL = { fromName: 'Zuri', localPart: 'compte' } as const

export type LoginMethod = 'password' | 'google' | 'reset'

export interface LoginContext {
  userAgent: string | null
  ip: string
  country: string | null
}

export function loginContext(c: Context): LoginContext {
  const country = c.req.header('cf-ipcountry')
  return {
    userAgent: c.req.header('user-agent')?.slice(0, 512) ?? null,
    ip: clientIp((n) => c.req.header(n)),
    country: country && /^[A-Z]{2}$/.test(country) && country !== 'XX' ? country : null,
  }
}

/**
 * Note l'appareil de cette connexion (cookie longue durée, haché en base).
 * Alerte par email si l'appareil est inconnu ET que le compte en a déjà d'autres :
 * le premier appareil (inscription, ou première connexion après mise en place) sert de référence.
 */
export async function recordLogin(c: Context, user: User, method: LoginMethod, opts: { isNewAccount?: boolean } = {}) {
  let token = getCookie(c, DEVICE_COOKIE)
  if (!token || token.length < 20 || token.length > 100) token = randomToken(24)
  setCookie(c, DEVICE_COOKIE, token, { httpOnly: true, secure: isProd, sameSite: 'Lax', path: '/', maxAge: DEVICE_MAX_AGE_S })
  const deviceHash = sha256(token)
  const ctx = loginContext(c)

  const [known] = await db
    .select({ userId: userDevices.userId })
    .from(userDevices)
    .where(and(eq(userDevices.userId, user.id), eq(userDevices.deviceHash, deviceHash)))
    .limit(1)
  if (known) {
    await db.update(userDevices).set({ lastSeenAt: new Date(), userAgent: ctx.userAgent }).where(and(eq(userDevices.userId, user.id), eq(userDevices.deviceHash, deviceHash)))
    return
  }
  const [other] = await db
    .select({ userId: userDevices.userId })
    .from(userDevices)
    .where(and(eq(userDevices.userId, user.id), ne(userDevices.deviceHash, deviceHash)))
    .limit(1)
  await db.insert(userDevices).values({ userId: user.id, deviceHash, userAgent: ctx.userAgent }).onConflictDoNothing()

  // Après une réinitialisation, l'email « mot de passe modifié » suffit.
  if (other && !opts.isNewAccount && method !== 'reset') {
    await enqueue('account.notify', { userId: user.id, kind: 'new-login', method, ...ctx, at: new Date().toISOString() })
  }
}

/** Crée un lien de réinitialisation et l'envoie. Le jeton brut ne quitte jamais ce processus (pas de file d'attente). */
export async function sendPasswordReset(user: User): Promise<void> {
  // Anti-spam : un seul lien par minute et par compte.
  const [recent] = await db
    .select({ id: passwordResets.id })
    .from(passwordResets)
    .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt), gt(passwordResets.createdAt, new Date(Date.now() - 60_000))))
    .limit(1)
  if (recent) return
  // Un seul lien valable à la fois : le dernier demandé.
  await db.delete(passwordResets).where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)))
  const token = randomToken(32)
  await db.insert(passwordResets).values({ id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) })
  const mail = passwordResetEmail({ name: user.name, resetUrl: `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`, minutes: RESET_TTL_MIN })
  await sendEmail(user.email, mail.subject, mail.html, ACCOUNT_MAIL)
}

// ─── Rendu des emails envoyés par le worker ─────────────────────────────────

/** « Chrome sur Windows », « Safari sur iPhone »… Volontairement simple. */
export function describeDevice(ua: string | null | undefined): string {
  if (!ua) return 'Appareil inconnu'
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'Mac'
            : /CrOS/.test(ua)
              ? 'Chromebook'
              : /Linux/.test(ua)
                ? 'Linux'
                : null
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Firefox\/|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : null
  if (browser && os) return `${browser} sur ${os}`
  return browser ?? os ?? 'Appareil inconnu'
}

const countryName = (code: string | null | undefined) => {
  if (!code) return null
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function formatWhen(date: Date, country: string | null | undefined): string {
  const timeZone = timezoneForCountry(country ?? '')
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone }).format(date)
}

const METHOD_LABEL: Record<LoginMethod, string> = { password: 'Email et mot de passe', google: 'Google', reset: 'Lien de réinitialisation' }

export type AccountNotice =
  | { userId: number; kind: 'welcome' }
  | ({ userId: number; kind: 'new-login'; method: LoginMethod; at?: string } & LoginContext)
  | { userId: number; kind: 'password-changed'; userAgent: string | null; at?: string }

export async function sendAccountNotice(user: User, notice: AccountNotice): Promise<void> {
  const forgotUrl = `${env.APP_URL}/forgot-password`
  const at = 'at' in notice && notice.at ? new Date(notice.at) : new Date()
  let mail: { subject: string; html: string }
  if (notice.kind === 'welcome') {
    mail = welcomeEmail({ name: user.name, appUrl: env.APP_URL })
  } else if (notice.kind === 'new-login') {
    const where = countryName(notice.country)
    mail = newLoginEmail({
      name: user.name,
      when: formatWhen(at, user.country),
      device: describeDevice(notice.userAgent),
      location: where ? `${where} (IP ${notice.ip})` : `IP ${notice.ip}`,
      method: METHOD_LABEL[notice.method],
      forgotUrl,
    })
  } else {
    mail = passwordChangedEmail({ name: user.name, when: formatWhen(at, user.country), device: describeDevice(notice.userAgent), forgotUrl })
  }
  await sendEmail(user.email, mail.subject, mail.html, ACCOUNT_MAIL)
}
