import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { contactMessages, onboardingEmails, products, storeMembers, stores, users } from '../src/db/schema'
import { dueStep, langOf, onboardingEmail, runOnboarding, unsubscribeUrl } from '../src/services/onboarding'
import { welcomeEmail } from '../src/services/emails'
import { Client } from './helpers'

/** Site Zuri : page contact, emails d'accompagnement des vendeurs, désinscription, super admin. */
const admin = new Client()
const visitor = new Client()
const HOUR = 3600_000

async function account(email: string, opts: { admin?: boolean; ageHours?: number; from?: string } = {}) {
  const [u] = await db
    .insert(users)
    .values({
      email,
      name: 'Awa Diallo',
      isPlatformAdmin: opts.admin ?? false,
      signupSource: opts.from ? { from: opts.from, method: 'password' } : { method: 'password' },
      passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }),
      createdAt: new Date(Date.now() - (opts.ageHours ?? 0) * HOUR),
    })
    .returning()
  return u!
}

describe('page contact', () => {
  test('message enregistré, robot ignoré, coordonnées publiques', async () => {
    await account('site-admin@test.dev', { admin: true })
    await admin.post('/api/auth/login', { email: 'site-admin@test.dev', password: 'motdepasse-solide' })
    const info = await visitor.get('/api/v1/platform/contact')
    expect(info.body).toEqual({ email: 'contact@zurisell.store', whatsapp: null })

    const r = await visitor.post('/api/v1/contact', { name: 'Koffi', email: 'Koffi@Test.dev', message: 'Bonjour, je veux vendre des perruques à Lomé.', page: '/contact', lang: 'fr' })
    expect(r.status).toBe(201)
    const bot = await visitor.post('/api/v1/contact', { name: 'Bot', email: 'bot@test.dev', message: 'Achetez mes liens pas chers', website: 'http://spam.test' })
    expect(bot.body).toEqual({ ok: true })
    expect((await visitor.post('/api/v1/contact', { name: 'K', email: 'pas-un-email', message: 'court' })).status).toBe(422)
    const rows = await db.select().from(contactMessages)
    expect(rows.map((m) => m.email)).toEqual(['koffi@test.dev'])
  })

  test('super admin : réglages de contact, liste des messages, traité', async () => {
    expect((await admin.put('/api/admin/settings', { contactEmail: 'hello@zurisell.store', contactWhatsapp: '+229 01 40 18 81 35' })).status).toBe(200)
    expect((await visitor.get('/api/v1/platform/contact')).body).toEqual({ email: 'hello@zurisell.store', whatsapp: '+2290140188135' })
    expect((await admin.put('/api/admin/settings', { contactWhatsapp: 'abc' })).status).toBe(422)

    const list = await admin.get('/api/admin/messages')
    expect(list.body.counts).toEqual({ new: 1, done: 0 })
    expect(list.body.data[0]).toMatchObject({ name: 'Koffi', status: 'new' })
    expect(list.body.data[0].ip).toBeUndefined()
    await admin.patch(`/api/admin/messages/${list.body.data[0].id}`, { status: 'done' })
    expect((await admin.get('/api/admin/messages')).body.data).toHaveLength(0)
    expect((await admin.get('/api/admin/messages?status=done')).body.data).toHaveLength(1)
    expect((await admin.get('/api/admin/overview')).body.newMessages).toBe(0)
    // Réservé au super admin.
    expect((await visitor.get('/api/admin/messages')).status).toBe(401)
  })
})

describe('emails d’accompagnement', () => {
  test('étape due : délais, ordre des étapes, un email tous les deux jours au plus', () => {
    const now = Date.now()
    const iso = (h: number) => new Date(now - h * HOUR).toISOString()
    const base = { first_store_at: null, first_product_at: null, orders: 0, sent: null }
    expect(dueStep({ ...base, created_at: iso(5) }, now)).toBeNull()
    expect(dueStep({ ...base, created_at: iso(25) }, now)).toEqual({ kind: 'no_store', step: 1 })
    // Compte de 5 jours sans rien reçu : d'abord l'étape 1, pas les deux d'un coup.
    expect(dueStep({ ...base, created_at: iso(120) }, now)).toEqual({ kind: 'no_store', step: 1 })
    expect(dueStep({ ...base, created_at: iso(120), sent: [{ kind: 'no_store', step: 1, at: iso(10) }] }, now)).toBeNull()
    expect(dueStep({ ...base, created_at: iso(120), sent: [{ kind: 'no_store', step: 1, at: iso(48) }] }, now)).toEqual({ kind: 'no_store', step: 2 })
    // Boutique créée : on passe à l'étape suivante du parcours.
    expect(dueStep({ ...base, created_at: iso(120), first_store_at: iso(30), sent: [{ kind: 'no_store', step: 1, at: iso(48) }] }, now)).toEqual({ kind: 'no_product', step: 1 })
    expect(dueStep({ ...base, created_at: iso(200), first_store_at: iso(150), first_product_at: iso(80), sent: [] }, now)).toEqual({ kind: 'no_order', step: 1 })
    expect(dueStep({ ...base, created_at: iso(200), first_store_at: iso(150), first_product_at: iso(80), orders: 1, sent: [] }, now)).toBeNull()
  })

  test('langue de la page d’inscription, contenu sans emoji ni tiret long, mobile', () => {
    expect(langOf({ from: '/en/countries/sell-online-tanzania' })).toBe('en')
    expect(langOf({ from: '/pays/vendre-en-ligne-benin' })).toBe('fr')
    expect(langOf(null)).toBe('fr')
    const en = onboardingEmail('no_product', 1, { name: 'Tracee Sangawe', lang: 'en', appUrl: 'https://app.zurisell.store', storeName: 'Tracee Shop', unsubscribe: 'https://x/u', whatsapp: '+2290140188135' })
    expect(en.subject).toBe('Add your first product to Tracee Shop')
    expect(en.html).toContain('Hi Tracee')
    expect(en.html).toContain('https://wa.me/2290140188135')
    expect(en.html).toContain('Stop these emails')
    for (const [kind, step] of [['no_store', 1], ['no_store', 2], ['no_product', 2], ['no_order', 1], ['no_order', 2]] as const) {
      for (const lang of ['fr', 'en'] as const) {
        const m = onboardingEmail(kind, step, { name: 'Awa', lang, appUrl: 'https://app', unsubscribe: 'https://x/u' })
        expect(m.html).not.toMatch(/[—–]|\p{Extended_Pictographic}/u)
        expect(m.html).toContain('name="viewport"')
      }
    }
    expect(welcomeEmail({ name: 'Tracee', appUrl: 'https://app', lang: 'en' }).subject).toBe('Welcome to Zuri')
  })

  test('envoi réel : une fois par étape, en journée seulement, désinscription respectée', async () => {
    const noStore = await account('onb-nostore@test.dev', { ageHours: 30, from: '/en/countries/sell-online-tanzania' })
    const noProduct = await account('onb-noproduct@test.dev', { ageHours: 60 })
    const fresh = await account('onb-fresh@test.dev', { ageHours: 2 })
    const [s] = await db.insert(stores).values({ name: 'Boutique Awa', slug: 'onb-awa', currency: 'XOF', createdAt: new Date(Date.now() - 50 * HOUR) } as typeof stores.$inferInsert).returning()
    await db.insert(storeMembers).values({ storeId: s!.id, userId: noProduct.id, role: 'owner' } as typeof storeMembers.$inferInsert)

    const night = new Date()
    night.setUTCHours(2)
    expect(await runOnboarding(night)).toBe(0)
    const day = new Date()
    day.setUTCHours(10)
    expect(await runOnboarding(day)).toBeGreaterThanOrEqual(2)
    const sent = await db.select().from(onboardingEmails)
    expect(sent.find((e) => e.userId === noStore.id)).toMatchObject({ kind: 'no_store', step: 1 })
    expect(sent.find((e) => e.userId === noProduct.id)).toMatchObject({ kind: 'no_product', step: 1 })
    expect(sent.find((e) => e.userId === fresh.id)).toBeUndefined()
    // Relancer tout de suite n'envoie rien de plus.
    const before = sent.length
    await runOnboarding(day)
    expect((await db.select().from(onboardingEmails)).length).toBe(before)

    // Désinscription par le lien de l'email.
    const url = new URL(unsubscribeUrl(noStore.id))
    const bad = await visitor.req('GET', `/api/v1/unsubscribe?u=${noStore.id}&t=faux`)
    expect(bad.status).toBe(400)
    const ok = await visitor.req('GET', `/api/v1/unsubscribe${url.search}`)
    expect(ok.status).toBe(200)
    const [u] = await db.select().from(users).where(eq(users.id, noStore.id))
    expect(u!.emailOptOutAt).not.toBeNull()

    // Super admin : étape et relances visibles sur le compte, parcours dans la vue d'ensemble.
    const detail = await admin.get(`/api/admin/users/${noProduct.id}`)
    expect(detail.body.stage).toBe('no_product')
    expect(detail.body.nudges).toHaveLength(1)
    const list = await admin.get('/api/admin/users?q=onb-noproduct')
    expect(list.body.data[0]).toMatchObject({ stage: 'no_product', nudges: 1 })
    await db.insert(products).values({ storeId: s!.id, name: 'Perruque', price: 15000, content: {}, payment: { method: 'cod', integration: null } } as typeof products.$inferInsert)
    expect((await admin.get(`/api/admin/users/${noProduct.id}`)).body.stage).toBe('no_order')
    const ov = await admin.get('/api/admin/overview')
    expect(ov.body.funnel.signed).toBeGreaterThanOrEqual(3)
    expect(ov.body.funnel.product).toBeGreaterThanOrEqual(1)
  })
})

describe('langue et alertes du super admin', () => {
  test('inscription : langue du navigateur retenue, puis celle de la boutique fait foi', async () => {
    const c = new Client()
    c.headers['accept-language'] = 'en-US,en;q=0.9,fr;q=0.8'
    const { env } = await import('../src/lib/env')
    const previous = env.REGISTRATION_OPEN
    env.REGISTRATION_OPEN = 'true'
    const r = await c.post('/api/auth/register', { name: 'Tracee', email: 'lang-en@test.dev', password: 'motdepasse-solide' }).finally(() => (env.REGISTRATION_OPEN = previous))
    expect(r.status).toBe(201)
    const [u] = await db.select().from(users).where(eq(users.email, 'lang-en@test.dev'))
    expect(u!.signupSource?.lang).toBe('en')
    expect(langOf(u!.signupSource)).toBe('en')
    // La boutique est réglée en français : les emails passent en français.
    expect(langOf(u!.signupSource, 'fr')).toBe('fr')
    expect(langOf({ lang: 'fr' }, 'en')).toBe('en')
    // Nouvel inscrit : le super admin est alerté (tâche en file d'attente ou envoi direct par le worker).
    const { enqueued } = await import('../src/jobs/queue')
    expect(enqueued.some((j) => j.name === 'account.notify' && (j.data as { kind: string }).kind === 'welcome')).toBe(true)
  })

  test('message de contact : alerte au super admin', async () => {
    const { enqueued } = await import('../src/jobs/queue')
    await new Client().post('/api/v1/contact', { name: 'Moussa', email: 'moussa@test.dev', message: 'Je veux une démo pour mon équipe de closers.' })
    expect(enqueued.some((j) => j.name === 'admin.notify' && (j.data as { path: string }).path === '/admin/messages')).toBe(true)
  })

  test('alerte : chaque admin actif est prévenu (email à défaut de téléphone ou Telegram)', async () => {
    const { notifyPlatformAdmins } = await import('../src/services/admin-notify')
    const n = await notifyPlatformAdmins({ title: 'Nouvel inscrit sur Zuri', body: 'Tracee (lang-en@test.dev)', path: '/admin/users/1' })
    expect(n).toBeGreaterThanOrEqual(1)
  })

  test('emails de commande et de panier dans la langue de la boutique', async () => {
    const { customerOrderEmail, customerDigitalEmail } = await import('../src/services/order-emails')
    const { abandonedCartEmail } = await import('../src/services/emails')
    const base = { storeName: 'Tracee Shop', color: '#f59e0b', orderNumber: 'ZR-1', createdAt: new Date().toISOString(), customerName: 'Amina Juma', customerPhone: '+255712345678', customerEmail: 'a@test.dev', city: 'Dar es Salaam', address: null, note: null, items: [{ name: 'Wig', variant: null, quantity: 1, total: 50000, image: null, role: 'main' as const, bundle: null }], subtotal: 50000, discount: 0, shippingFee: 0, total: 50000, currency: 'TZS', cod: true, digital: false, paymentLabel: 'Cash on delivery', support: { phone: null, email: null }, trackUrl: 'https://x/t', etaLabel: null }
    const en = customerOrderEmail({ ...base, lang: 'en' })
    expect(en.subject).toBe('Order ZR-1 received · Tracee Shop')
    expect(en.html).toContain('Thank you Amina! Your order is confirmed')
    expect(en.html).toContain('lang="en"')
    expect(en.html).not.toMatch(/Livraison|Commande|Merci/)
    expect(customerOrderEmail(base).subject).toBe('Commande ZR-1 bien reçue · Tracee Shop')
    expect(customerDigitalEmail({ ...base, lang: 'en', digital: true, cod: false, accessUrl: 'https://x/a' }).subject).toBe('Your access is ready · Wig')
    expect(abandonedCartEmail({ step: 1, storeName: 'Tracee Shop', name: 'Amina', product: 'Wig', url: 'https://x', lang: 'en' }).subject).toBe('Did you forget something?')
  })
})
