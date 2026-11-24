/** Parrainage du compte connecté (sous /api/referrals) : lien, filleuls, mois gagnés. */
import { and, desc, eq, isNotNull, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { users } from '../db/schema'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { REFERRAL_CAP, REFERRAL_MONTHS, REFERRAL_PLAN, referralCodeFor, referralLink } from '../services/referrals'

export const referralRoutes = new Hono<AppEnv>().use(requireAuth).get('/', async (c) => {
  const me = c.get('user')
  const code = await referralCodeFor(me.id)
  const rows = await db
    .select({
      name: users.name,
      createdAt: users.createdAt,
      rewardedAt: users.referralRewardedAt,
      hasStore: dsql<boolean>`exists (select 1 from store_members m where m.user_id = "users"."id" and m.role = 'owner')`,
    })
    .from(users)
    .where(eq(users.referredBy, me.id))
    .orderBy(desc(users.createdAt))
    .limit(200)
  const [{ rewarded } = { rewarded: 0 }] = await db.select({ rewarded: dsql<number>`count(*)::int` }).from(users).where(and(eq(users.referredBy, me.id), isNotNull(users.referralRewardedAt)))
  return c.json({
    code,
    link: referralLink(code),
    reward: { plan: REFERRAL_PLAN, months: REFERRAL_MONTHS, cap: REFERRAL_CAP },
    stats: { signed: rows.length, sold: rewarded, monthsEarned: Math.min(rewarded, REFERRAL_CAP) * REFERRAL_MONTHS },
    // Prénom seulement : le parrain n'a pas besoin des coordonnées de ses filleuls.
    referrals: rows.map((r) => ({ name: r.name.trim().split(/\s+/)[0] ?? '', createdAt: r.createdAt, stage: r.rewardedAt ? 'sold' : r.hasStore ? 'store' : 'signed' })),
  })
})
