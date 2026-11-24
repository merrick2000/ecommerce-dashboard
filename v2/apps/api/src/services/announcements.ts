/**
 * Annonces de la plateforme : ciblage des vendeurs (étape, langue, type de boutique, pays), annonces actives
 * pour un compte, et envoi en notification sur le téléphone des comptes ciblés.
 */
import { and, eq, gt, isNull, lte, or, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { announcementDismissals, announcements, type AnnouncementAudience } from '../db/schema'
import { env } from '../lib/env'
import { sendPushToUser } from './notifications'
import { langOf } from './onboarding'

export interface SellerTraits {
  id: number
  stage: 'no_store' | 'no_product' | 'no_order' | 'active'
  lang: 'fr' | 'en'
  kinds: ('physical' | 'digital')[]
  countries: string[]
}

/** Caractéristiques des comptes (un seul ou tous) utilisées pour le ciblage. */
export async function sellerTraits(userId?: number): Promise<SellerTraits[]> {
  const rows = await db.execute<{ id: number; signup_source: { from?: string; landing?: string; lang?: string } | null; country: string | null; store_locale: string | null; kinds: string[] | null; store_countries: string[] | null; stage: SellerTraits['stage'] }>(dsql`
    select u.id, u.signup_source, u.country,
      (select s.locale from stores s join store_members m on m.store_id = s.id and m.role = 'owner' where m.user_id = u.id order by s.created_at limit 1) as store_locale,
      (select array_agg(distinct s.kind) from stores s join store_members m on m.store_id = s.id and m.role = 'owner' where m.user_id = u.id) as kinds,
      (select array_agg(distinct s.country) from stores s join store_members m on m.store_id = s.id and m.role = 'owner' where m.user_id = u.id) as store_countries,
      (case
        when not exists (select 1 from store_members m where m.user_id = u.id and m.role = 'owner') then 'no_store'
        when not exists (select 1 from products p join store_members m on m.store_id = p.store_id and m.role = 'owner' where m.user_id = u.id) then 'no_product'
        when not exists (select 1 from orders o join store_members m on m.store_id = o.store_id and m.role = 'owner' where m.user_id = u.id and o.source <> 'manual') then 'no_order'
        else 'active' end) as stage
    from users u
    where u.disabled_at is null ${userId ? dsql`and u.id = ${userId}` : dsql``}`)
  return rows.map((r) => ({
    id: r.id,
    stage: r.stage,
    lang: langOf(r.signup_source, r.store_locale),
    kinds: (r.kinds ?? []) as SellerTraits['kinds'],
    countries: [...new Set([r.country, ...(r.store_countries ?? [])].filter((c): c is string => !!c))],
  }))
}

/** Un compte correspond-il à la cible ? Chaque critère vide accepte tout le monde. */
export function matches(a: AnnouncementAudience, t: SellerTraits): boolean {
  if (a.stages?.length && !a.stages.includes(t.stage)) return false
  if (a.langs?.length && !a.langs.includes(t.lang)) return false
  if (a.kinds?.length && !t.kinds.some((k) => a.kinds!.includes(k))) return false
  if (a.countries?.length && !t.countries.some((c) => a.countries!.includes(c))) return false
  return true
}

export async function audienceSize(a: AnnouncementAudience): Promise<number> {
  return (await sellerTraits()).filter((t) => matches(a, t)).length
}

/** Annonces en cours, visibles par ce compte (non fermées, dans la cible). */
export async function activeAnnouncementsFor(userId: number) {
  const now = new Date()
  const rows = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.active, true),
        lte(announcements.startsAt, now),
        or(isNull(announcements.endsAt), gt(announcements.endsAt, now)),
        dsql`not exists (select 1 from ${announcementDismissals} d where d.announcement_id = ${announcements.id} and d.user_id = ${userId})`,
      ),
    )
    .orderBy(dsql`${announcements.createdAt} desc`)
    .limit(10)
  if (!rows.length) return []
  const [traits] = await sellerTraits(userId)
  if (!traits) return []
  return rows.filter((r) => matches(r.audience, traits)).map(({ id, title, body, ctaLabel, ctaUrl, tone }) => ({ id, title, body, ctaLabel, ctaUrl, tone }))
}

/** Notification sur le téléphone des comptes ciblés (une fois par annonce). */
export async function pushAnnouncement(id: number): Promise<number> {
  const [a] = await db.update(announcements).set({ pushedAt: new Date() }).where(and(eq(announcements.id, id), isNull(announcements.pushedAt), eq(announcements.push, true))).returning()
  if (!a) return 0
  const app = env.APP_URL.replace(/\/$/, '')
  const url = a.ctaUrl ? (/^https?:\/\//.test(a.ctaUrl) ? a.ctaUrl : `${app}${a.ctaUrl.startsWith('/') ? '' : '/'}${a.ctaUrl}`) : app
  const targets = (await sellerTraits()).filter((t) => matches(a.audience, t))
  let reached = 0
  for (const t of targets.slice(0, 5000)) {
    reached += (await sendPushToUser(t.id, { title: a.title, body: a.body.slice(0, 180), url, tag: `announcement-${a.id}`, event: 'platform', sound: 'soft' }).catch(() => 0)) > 0 ? 1 : 0
  }
  await db.update(announcements).set({ pushedCount: reached }).where(eq(announcements.id, a.id))
  return reached
}
