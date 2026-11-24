/**
 * Plateforme : réglages globaux (super admin), options par compte, formule en vigueur et limites.
 */
import { effectivePlan, PLANS, type EffectivePlan, type PlanId, type SignupSource } from '@zuri/shared'
import { and, eq, isNull, sql as dsql } from 'drizzle-orm'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { db } from '../db/client'
import { platformSettings, storeMembers, stores, subscriptions, users, type User } from '../db/schema'
import { HttpError } from '../lib/errors'

export type SettingKey = 'payments.online' | 'billing.enabled' | 'billing.account' | 'import.url' | 'firecrawl.key' | 'po.platform' | 'contact.email' | 'contact.whatsapp' | 'social.links'

export async function getSetting<T>(key: SettingKey, fallback: T): Promise<T> {
  const [row] = await db.select({ value: platformSettings.value }).from(platformSettings).where(eq(platformSettings.key, key)).limit(1)
  return (row?.value as T) ?? fallback
}

export async function setSetting(key: SettingKey, value: unknown) {
  // Valeur vide = réglage retiré (la colonne n'accepte pas null).
  if (value === null || value === undefined) {
    await db.delete(platformSettings).where(eq(platformSettings.key, key))
    return
  }
  await db.insert(platformSettings).values({ key, value }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } })
}

/** Options effectives d'un compte : le super admin a tout, sinon réglage global OU option propre au compte. */
export async function resolveFeatures(user: Pick<User, 'isPlatformAdmin' | 'features'>) {
  if (user.isPlatformAdmin) return { onlinePayments: true, billing: true, urlImport: true }
  const [online, billing, urlImport] = await Promise.all([getSetting('payments.online', false), getSetting('billing.enabled', false), getSetting('import.url', false)])
  return {
    onlinePayments: Boolean(online || user.features?.onlinePayments),
    billing: Boolean(billing || user.features?.billing),
    /** Import de produit par lien (Firecrawl + IA, coûteux) : réservé tant que le super admin ne l'ouvre pas. */
    urlImport: Boolean(urlImport || user.features?.urlImport),
  }
}

export async function planForUser(user: Pick<User, 'id' | 'createdAt'>): Promise<EffectivePlan> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1)
  return effectivePlan({ createdAt: user.createdAt, subscription: sub ?? null })
}

/** Propriétaire d'une boutique (sa formule s'applique à la boutique). */
export async function storeOwner(storeId: string) {
  const [row] = await db
    .select({ user: users })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.role, 'owner')))
    .limit(1)
  return row?.user ?? null
}

export async function planForStore(storeId: string): Promise<EffectivePlan> {
  const owner = await storeOwner(storeId)
  if (!owner) return effectivePlan({ createdAt: new Date(), subscription: null })
  if (owner.isPlatformAdmin) return { ...effectivePlan({ createdAt: owner.createdAt }), plan: 'business', reason: 'subscription', limits: { stores: null, products: null, ordersPerMonth: null, members: null }, features: PLANS.business.features }
  return planForUser(owner)
}

const LIMIT_LABEL = { stores: 'boutiques', products: 'produits', members: 'membres d’équipe', ordersPerMonth: 'commandes par mois' } as const

/** Refuse l'action si la limite de la formule est atteinte (402 : passer à une formule supérieure). */
export function assertWithinLimit(plan: EffectivePlan, kind: keyof EffectivePlan['limits'], current: number) {
  const max = plan.limits[kind]
  if (max === null || current < max) return
  const msg =
    plan.reason === 'expired'
      ? 'L’offre gratuite est terminée. Choisis une formule pour continuer.'
      : `Ta formule ${PLANS[plan.plan].name} permet ${max} ${LIMIT_LABEL[kind]}. Passe à une formule supérieure pour en ajouter.`
  throw new HttpError(402, msg, 'plan_limit')
}

export async function assertFeature(plan: EffectivePlan, feature: keyof EffectivePlan['features']) {
  if (!plan.features[feature]) throw new HttpError(402, `Cette fonction n’est pas incluse dans la formule ${PLANS[plan.plan].name}.`, 'plan_feature')
}

export async function countOwnedStores(userId: number) {
  const [r] = await db
    .select({ n: dsql<number>`count(*)::int` })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(and(eq(storeMembers.userId, userId), eq(storeMembers.role, 'owner'), isNull(stores.closedAt)))
  return r?.n ?? 0
}

/** Provenance de l'inscription : cookie posé par le site marketing + page d'origine du clic. */
export function readSignupSource(c: Context, method: SignupSource['method'], from?: string | null): SignupSource {
  const out: SignupSource = { method }
  try {
    const raw = getCookie(c, 'zuri_src')
    if (raw) {
      const j = JSON.parse(raw) as Record<string, string>
      const cut = (v?: string, n = 200) => (v ? String(v).slice(0, n) : undefined)
      Object.assign(out, { utmSource: cut(j.s), utmMedium: cut(j.m), utmCampaign: cut(j.c), referrer: cut(j.r), landing: cut(j.l), firstSeen: cut(j.t, 10) })
    }
  } catch {
    /* cookie illisible : ignoré */
  }
  if (from) out.from = from.slice(0, 200)
  // Langue préférée du navigateur : la première citée entre français et anglais.
  const accept = (c.req.header('accept-language') ?? '').toLowerCase()
  const fr = accept.search(/\bfr\b/)
  const en = accept.search(/\ben\b/)
  if (en >= 0 && (fr < 0 || en < fr)) out.lang = 'en'
  else if (fr >= 0) out.lang = 'fr'
  for (const k of Object.keys(out) as (keyof SignupSource)[]) if (!out[k]) delete out[k]
  return out
}

export type { PlanId }

/** Paiement en ligne ouvert pour cette boutique (super admin, réglage global ou option du compte du propriétaire). */
export async function storeOnlinePayments(storeId: string): Promise<boolean> {
  const owner = await storeOwner(storeId)
  return Boolean(owner && (await resolveFeatures(owner)).onlinePayments)
}
