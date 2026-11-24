import { describe, expect, test } from 'bun:test'
import { and, eq, like } from 'drizzle-orm'
import { db } from '../src/db/client'
import { billingPayments, onboardingEmails, users } from '../src/db/schema'
import { dueBillingStep, runBillingRecovery } from '../src/services/billing-recovery'

/** Relance des paiements d'abonnement abandonnés : 1 h puis 24 h, une fois, jamais après un paiement réussi. */
const HOUR = 3600_000
const daytime = () => {
  const d = new Date()
  while (d.getUTCHours() < 7 || d.getUTCHours() >= 19) d.setTime(d.getTime() + HOUR)
  return d
}

async function seller(email: string, billing = true) {
  const [u] = await db.insert(users).values({ email, name: 'Awa Diallo', features: billing ? { billing: true } : {}, passwordHash: 'x' } as typeof users.$inferInsert).returning()
  return u!
}
async function attempt(userId: number, at: Date, opts: { status?: string; ref?: string | null } = {}) {
  const [b] = await db.insert(billingPayments).values({ userId, plan: 'starter', months: 1, amount: 4900, currency: 'XOF', provider: 'orchestrator', status: opts.status ?? 'failed', providerRef: opts.ref === undefined ? 'cs_test_1' : opts.ref, createdAt: at } as typeof billingPayments.$inferInsert).returning()
  return b!
}
const sentFor = (userId: number) => db.select().from(onboardingEmails).where(and(eq(onboardingEmails.userId, userId), like(onboardingEmails.kind, 'billing_%')))

describe('relance des abonnements abandonnés', () => {
  test('calendrier des étapes', () => {
    const now = Date.now()
    expect(dueBillingStep(new Date(now - 30 * 60_000), [], now)).toBeNull()
    expect(dueBillingStep(new Date(now - 2 * HOUR), [], now)).toBe(1)
    expect(dueBillingStep(new Date(now - 2 * HOUR), [1], now)).toBeNull()
    expect(dueBillingStep(new Date(now - 25 * HOUR), [1], now)).toBe(2)
    expect(dueBillingStep(new Date(now - 25 * HOUR), [1, 2], now)).toBeNull()
    expect(dueBillingStep(new Date(now - 5 * 24 * HOUR), [], now)).toBeNull()
  })

  test('envoi une fois, jamais après un paiement réussi, ni sans tentative réelle, ni la nuit', async () => {
    const now = daytime()
    const awa = await seller('relance-abo-awa@test.dev')
    await attempt(awa.id, new Date(now.getTime() - 2 * HOUR))
    const paid = await seller('relance-abo-paye@test.dev')
    await attempt(paid.id, new Date(now.getTime() - 3 * HOUR))
    await attempt(paid.id, new Date(now.getTime() - 2 * HOUR), { status: 'paid' })
    const neverStarted = await seller('relance-abo-config@test.dev')
    await attempt(neverStarted.id, new Date(now.getTime() - 2 * HOUR), { ref: null })
    const closed = await seller('relance-abo-ferme@test.dev', false)
    await attempt(closed.id, new Date(now.getTime() - 2 * HOUR))

    const night = new Date(now)
    night.setUTCHours(2)
    expect(await runBillingRecovery(night)).toBe(0)

    await runBillingRecovery(now)
    expect((await sentFor(awa.id)).map((e) => e.step)).toEqual([1])
    expect(await sentFor(paid.id)).toHaveLength(0)
    expect(await sentFor(neverStarted.id)).toHaveLength(0)
    expect(await sentFor(closed.id)).toHaveLength(0)

    // Relancer tout de suite n'envoie rien de plus ; 24 h plus tard, le dernier rappel part.
    await runBillingRecovery(now)
    expect(await sentFor(awa.id)).toHaveLength(1)
    await runBillingRecovery(new Date(now.getTime() + 23 * HOUR))
    const later = new Date(now.getTime() + 23 * HOUR)
    while (later.getUTCHours() < 7 || later.getUTCHours() >= 19) later.setTime(later.getTime() + HOUR)
    await runBillingRecovery(later)
    expect((await sentFor(awa.id)).map((e) => e.step).sort()).toEqual([1, 2])
  })
})
