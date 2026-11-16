/**
 * Import unique de la base Laravel (Sellit v1) vers le schéma v2.
 *
 *   LEGACY_DATABASE_URL=postgres://… bun run import:legacy [--dry-run]
 *
 * - Conserve les ID des boutiques, produits et commandes : les liens de pub
 *   (/boutique/p/123) et l'historique restent valides.
 * - Idempotent pour un import dans une base v2 VIDE (refuse sinon).
 * - Tout se fait dans une transaction : en cas d'erreur, rien n'est écrit.
 */
import { productContentSchema, type CheckoutSettings, type ProductContent, type ProductPayment } from '@sellit/shared'
import postgres from 'postgres'
import { db, sql as target } from './client'
import * as s from './schema'
import { encrypt, encryptJson, orderNumber, randomToken } from '../lib/crypto'
import { env } from '../lib/env'
import { normalizePhone } from '../services/orders'
import { DEFAULT_CHECKOUT } from '../routes/stores'
import { sql as dsql } from 'drizzle-orm'

const DRY_RUN = process.argv.includes('--dry-run')
if (!env.LEGACY_DATABASE_URL) {
  console.error('LEGACY_DATABASE_URL manquant')
  process.exit(1)
}
const legacy = postgres(env.LEGACY_DATABASE_URL, { max: 2 })

// ─── Utilitaires de conversion ──────────────────────────────────────────────

type Row = Record<string, any>
const json = <T>(v: unknown, fallback: T): T => {
  if (v == null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  return v as T
}
const num = (v: unknown, d = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v))
const date = (v: unknown) => (v ? new Date(v as string) : new Date())
const position = (v: unknown, fallback: 'before_description' | 'after_description') =>
  v === 'above_description' ? 'before_description' : v === 'below_description' ? 'after_description' : v === 'hidden' ? 'hidden' : fallback
const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v)

const stats: Record<string, number> = {}
const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n)
const warnings: string[] = []

function productContent(p: Row): ProductContent {
  const features = json<Row[] | string[]>(p.features, []).map((f) => (typeof f === 'string' ? f : (f.feature ?? f.text ?? ''))).filter(Boolean)
  const ctas = json<Row[]>(p.description_ctas, []).flatMap((c) => {
    if (!c?.text) return []
    const url = isUrl(c.url) ? c.url : undefined
    return [
      {
        text: String(c.text).slice(0, 80),
        action: c.action === 'custom_url' && url ? ('custom_url' as const) : ('scroll_to_form' as const),
        url,
        style: ['default', 'shake', 'pulse', 'glow', 'bounce', 'gradient', 'large'].includes(c.style) ? c.style : 'default',
        alignment: ['left', 'center', 'full'].includes(c.alignment) ? c.alignment : 'center',
        afterParagraph: num(c.after_paragraph),
        subText: c.sub_text ?? undefined,
      },
    ]
  })
  const wa = json<Row>(p.whatsapp_chat, {})
  const raw = {
    customText: p.custom_text ?? undefined,
    features,
    featuresPosition: position(p.features_position, 'after_description'),
    faqs: json<Row[]>(p.faqs, []).filter((f) => f?.question).map((f) => ({ question: String(f.question), answer: String(f.answer ?? '') })),
    testimonials: json<Row[]>(p.testimonials, [])
      .filter((t) => t?.name && t?.text)
      .map((t) => ({ name: String(t.name), city: t.city ?? undefined, rating: Math.min(5, Math.max(1, num(t.rating, 5))), text: String(t.text) })),
    testimonialsStyle: ['cards', 'minimal', 'highlight'].includes(p.testimonials_style) ? p.testimonials_style : 'cards',
    video: isUrl(p.video_url) ? { url: p.video_url, title: p.video_title ?? undefined, position: position(p.video_position, 'before_description') === 'after_description' ? 'after_description' : 'before_description' } : null,
    descriptionCtas: ctas,
    whatsapp: { enabled: Boolean(wa.enabled && wa.phone), phone: wa.phone ?? undefined, welcomeMessage: wa.welcome_message ?? undefined, position: wa.position === 'left' ? 'left' : 'right' },
    gallery: [],
  }
  const parsed = productContentSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  warnings.push(`Produit ${p.id} : contenu partiellement invalide, champs en défaut (${parsed.error.issues.map((i) => i.path.join('.')).join(', ')})`)
  return productContentSchema.parse({ customText: raw.customText, features: features.slice(0, 30) })
}

function productPayment(p: Row, redirectOnly: 'chariow' | 'maketou' | null): ProductPayment {
  if (p.payment_mode === 'external_link') {
    if (p.external_platform === 'chariow' && p.chariow_product_id) return { method: 'integration', integration: { platform: 'chariow', productId: p.chariow_product_id, url: null } }
    if (isUrl(p.payment_link)) return { method: 'integration', integration: { platform: p.external_platform === 'selar' ? 'selar' : 'link', url: p.payment_link, productId: null } }
  }
  // Ancien comportement « redirect only » : seuls Chariow/Maketou étaient actifs.
  if (redirectOnly === 'chariow' && p.chariow_product_id) return { method: 'integration', integration: { platform: 'chariow', productId: p.chariow_product_id, url: null } }
  if (redirectOnly === 'maketou' && p.maketou_product_id) return { method: 'integration', integration: { platform: 'maketou', productId: p.maketou_product_id, url: null } }
  return { method: 'native', integration: null }
}

function checkout(c: Row | undefined): { settings: CheckoutSettings; tracking: Row } {
  if (!c) return { settings: DEFAULT_CHECKOUT, tracking: {} }
  const u = json<Row>(c.urgency_config, {})
  const layout = json<Row[]>(c.page_layout, [])
  const validBlocks = new Set(DEFAULT_CHECKOUT.pageLayout.map((b) => b.block))
  const pageLayout = layout.filter((b) => validBlocks.has(b.key)).map((b) => ({ block: b.key, visible: Boolean(b.visible) }))
  // Sections absentes de l'ancienne mise en page : ajoutées à la fin avec leur visibilité par défaut.
  for (const d of DEFAULT_CHECKOUT.pageLayout) if (!pageLayout.some((b) => b.block === d.block)) pageLayout.push(d)
  const template = String(c.template_type ?? 'CLASSIC').toLowerCase()
  const settings: CheckoutSettings = {
    ...DEFAULT_CHECKOUT,
    template: ['classic', 'dark_premium', 'minimalist_card'].includes(template) ? (template as CheckoutSettings['template']) : 'classic',
    primaryColor: /^#[0-9a-f]{6}$/i.test(c.primary_color ?? '') ? c.primary_color : DEFAULT_CHECKOUT.primaryColor,
    ctaText: (c.cta_text ?? DEFAULT_CHECKOUT.ctaText).slice(0, 60),
    ctaStyle: ['default', 'shake', 'pulse', 'glow', 'bounce', 'gradient', 'large'].includes(c.cta_style) ? c.cta_style : 'default',
    trustBadges: json<string[]>(c.trust_badges, []).filter((b) => typeof b === 'string').slice(0, 8),
    paymentLogos: json<string[]>(c.payment_logos, []).filter((b) => typeof b === 'string').slice(0, 16),
    pageLayout: pageLayout.length ? pageLayout : DEFAULT_CHECKOUT.pageLayout,
    urgency: {
      countdown: u.countdown_timer ? { enabled: Boolean(u.countdown_timer.enabled), minutes: Math.min(1440, Math.max(5, num(u.countdown_timer.duration_minutes, 15))), label: u.countdown_timer.label ?? undefined } : undefined,
      limitedStock: u.limited_spots ? { enabled: Boolean(u.limited_spots.enabled), remaining: Math.max(1, num(u.limited_spots.remaining_spots, 10)) } : undefined,
      viewers: u.social_proof ? { enabled: Boolean(u.social_proof.enabled), base: Math.min(500, Math.max(1, num(u.social_proof.viewer_count, 12))) } : undefined,
    },
    // Les anciennes « ventes » du popup étaient fictives : on passe en vraies ventes uniquement.
    salesPopup: { enabled: Boolean(json<Row>(c.sales_popup, {}).enabled), intervalSeconds: Math.min(600, Math.max(5, num(json<Row>(c.sales_popup, {}).interval_seconds, 20))), realSalesOnly: true },
    abandonedCart: { enabled: false, promoCodeId: null },
  }
  return { settings, tracking: json<Row>(c.tracking_config, {}) }
}

const PROVIDER_KEYS: Record<string, Record<string, string>> = {
  feexpay: { api_key: 'apiKey', shop_id: 'shopId' },
  fedapay: { api_key: 'apiKey', webhook_secret: 'webhookSecret' },
  paydunya: { master_key: 'masterKey', public_key: 'publicKey', private_key: 'privateKey', token: 'token' },
  pawapay: { api_key: 'apiKey' },
  chariow: { api_key: 'apiKey', webhook_secret: 'webhookSecret' },
  maketou: { api_key: 'apiKey' },
}

// ─── Import ──────────────────────────────────────────────────────────────────

async function main() {
  const [{ n }] = (await target`select count(*)::int as n from stores`) as unknown as [{ n: number }]
  if (n > 0) throw new Error('La base v2 contient déjà des boutiques : import annulé (il doit se faire dans une base vide).')

  const [users, stores, configs, products, orders, txs, leads, clicks, settingsRows] = await Promise.all([
    legacy`select * from users order by id`,
    legacy`select * from stores order by id`,
    legacy`select * from checkout_configs`,
    legacy`select * from products order by id`,
    legacy`select * from orders order by id`,
    legacy`select * from payment_transactions order by id`,
    legacy`select * from leads order by id`,
    legacy`select * from download_clicks order by id`,
    legacy`select * from payment_settings order by id limit 1`,
  ])
  const globalPay = settingsRows[0] ? { mode: settingsRows[0].mode === 'live' ? 'live' : 'sandbox', providers: json<Row>(settingsRows[0].providers, {}) } : null
  const enabledProviders = globalPay ? Object.entries(globalPay.providers).filter(([, v]) => v?.enabled).map(([k]) => k) : []
  const redirectOnly =
    enabledProviders.length > 0 && enabledProviders.every((p) => p === 'chariow' || p === 'maketou') ? ((enabledProviders.includes('chariow') ? 'chariow' : 'maketou') as 'chariow' | 'maketou') : null

  await db.transaction(async (tx) => {
    // Utilisateurs (mots de passe bcrypt conservés, rehachés à la 1re connexion)
    for (const [i, u] of users.entries()) {
      await tx.insert(s.users).values({
        id: Number(u.id),
        email: String(u.email).toLowerCase(),
        name: [u.first_name, u.name].filter(Boolean).join(' ') || u.name,
        phone: u.phone?.slice(0, 30) ?? null,
        country: u.country?.length === 2 ? u.country.toUpperCase() : null,
        passwordHash: u.password,
        isPlatformAdmin: i === 0,
        createdAt: date(u.created_at),
      })
      bump('users')
    }

    for (const st of stores) {
      await tx.insert(s.stores).values({
        id: Number(st.id),
        name: st.name,
        slug: st.slug,
        subdomain: st.subdomain ?? st.slug,
        customDomain: st.custom_domain ?? null,
        // Les domaines déjà configurés en v1 sont considérés vérifiés (ils servaient déjà).
        customDomainVerifiedAt: st.custom_domain ? new Date() : null,
        // Secret du webhook Selar/n8n v1 conservé : n8n continue de fonctionner sans changement.
        integrationSecretEnc: settingsRows[0]?.webhook_secret ? encrypt(settingsRows[0].webhook_secret) : null,
        currency: st.currency ?? 'XOF',
        locale: st.locale ?? 'fr',
        createdAt: date(st.created_at),
      })
      await tx.insert(s.storeMembers).values({ storeId: Number(st.id), userId: Number(st.user_id), role: 'owner' })
      bump('stores')

      // Les clés de paiement étaient GLOBALES en v1 : on les copie sur chaque boutique (outil mono-propriétaire).
      if (globalPay) {
        for (const [provider, cfg] of Object.entries(globalPay.providers)) {
          if (!PROVIDER_KEYS[provider]) continue
          const creds: Record<string, Record<string, string>> = {}
          for (const mode of ['sandbox', 'live'] as const) {
            const src = (cfg?.[mode] ?? {}) as Row
            creds[mode] = Object.fromEntries(Object.entries(PROVIDER_KEYS[provider]!).flatMap(([from, to]) => (src[from] ? [[to, String(src[from])]] : [])))
          }
          await tx.insert(s.paymentAccounts).values({
            storeId: Number(st.id),
            provider: provider as s.PaymentAccount['provider'],
            enabled: Boolean(cfg?.enabled),
            mode: globalPay.mode as 'sandbox' | 'live',
            credentialsEnc: encryptJson(creds),
            webhookToken: randomToken(24),
          })
          bump('payment_accounts')
        }
      }

      const cfgRow = configs.find((c) => Number(c.store_id) === Number(st.id))
      const { settings, tracking } = checkout(cfgRow)
      const promo = json<Row>(cfgRow?.abandoned_cart_promo, {})
      if (promo.code && /^[A-Za-z0-9_-]{3,30}$/.test(promo.code)) {
        const [code] = await tx
          .insert(s.promoCodes)
          .values({ storeId: Number(st.id), code: String(promo.code).toUpperCase(), type: promo.type === 'fixed' ? 'fixed' : 'percentage', value: num(promo.value, 10), isActive: true })
          .returning({ id: s.promoCodes.id })
        settings.abandonedCart = { enabled: Boolean(promo.enabled), promoCodeId: code!.id }
        bump('promo_codes')
      }
      await tx.insert(s.checkoutSettings).values({
        storeId: Number(st.id),
        settings,
        facebookPixelId: /^\d{5,20}$/.test(tracking.facebook_pixel_id ?? '') ? tracking.facebook_pixel_id : null,
        facebookTestEventCode: tracking.facebook_test_event_code ?? null,
        tiktokPixelId: tracking.tiktok_pixel_id ?? null,
        facebookAccessTokenEnc: tracking.facebook_access_token ? encrypt(tracking.facebook_access_token) : null,
      })
    }

    const storeCurrency = new Map(stores.map((st) => [Number(st.id), st.currency ?? 'XOF']))
    for (const p of products) {
      const deliveryType = p.delivery_type === 'external_url' && isUrl(p.external_url) ? 'external_url' : 'file'
      await tx.insert(s.products).values({
        id: Number(p.id),
        storeId: Number(p.store_id),
        type: 'digital',
        name: p.name,
        isActive: Boolean(p.is_active),
        description: p.description ?? '',
        price: num(p.price),
        baseCurrency: p.base_currency ?? storeCurrency.get(Number(p.store_id)) ?? 'XOF',
        currencyPrices: json<Row[]>(p.currency_prices, []).filter((c) => c?.currency && c?.price != null).map((c) => ({ currency: c.currency, price: num(c.price) })),
        promo: {
          type: ['percentage', 'fixed'].includes(p.promo_type) ? p.promo_type : 'none',
          value: num(p.promo_value),
          label: p.promo_label ?? undefined,
          display: ['strikethrough', 'strikethrough_text', 'text_only'].includes(p.promo_display_style) ? p.promo_display_style : 'strikethrough',
        },
        coverImage: p.cover_image ?? null,
        thumbnail: p.thumbnail ?? null,
        content: productContent(p),
        payment: productPayment(p, redirectOnly),
        delivery: deliveryType === 'external_url' ? { type: 'external_url', url: p.external_url } : { type: 'file', filePath: p.digital_file_path ?? null },
        externalProductId: p.external_product_id ?? null,
        createdAt: date(p.created_at),
      })
      bump('products')
    }

    const productById = new Map(products.map((p) => [Number(p.id), p]))
    const customerIds = new Map<string, number>()
    for (const o of orders) {
      const storeId = Number(o.store_id)
      const phone = o.customer_phone ? normalizePhone(o.customer_phone).slice(0, 30) : null
      let customerId: number | null = null
      if (phone && phone.length >= 6) {
        const key = `${storeId}:${phone}`
        customerId = customerIds.get(key) ?? null
        if (!customerId) {
          const [c] = await tx.insert(s.customers).values({ storeId, phone, name: o.customer_name, email: o.customer_email }).returning({ id: s.customers.id })
          customerId = c!.id
          customerIds.set(key, customerId)
          bump('customers')
        }
        const paid = o.status === 'paid'
        await tx
          .update(s.customers)
          .set({ ordersCount: dsql`${s.customers.ordersCount} + 1`, ...(paid ? { deliveredCount: dsql`${s.customers.deliveredCount} + 1`, totalSpent: dsql`${s.customers.totalSpent} + ${num(o.amount)}` } : {}) })
          .where(dsql`${s.customers.id} = ${customerId}`)
      }
      const status = ['pending', 'paid', 'failed', 'refunded'].includes(o.status) ? o.status : 'pending'
      const external = o.source && o.source !== 'native'
      const created = date(o.created_at)
      await tx.insert(s.orders).values({
        id: Number(o.id),
        storeId,
        orderNumber: o.order_number ?? orderNumber(),
        accessToken: randomToken(24),
        customerId,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: phone,
        kind: 'digital',
        subtotal: num(o.amount),
        total: num(o.amount),
        currency: o.currency ?? 'XOF',
        paymentMethod: external ? 'external' : 'mobile_money',
        paymentStatus: status,
        paymentProvider: o.payment_method ?? null,
        paymentRef: o.payment_ref ?? null,
        paidAt: status === 'paid' ? date(o.updated_at) : null,
        fulfillmentStatus: status === 'paid' ? 'delivered' : status === 'refunded' ? 'returned' : 'new',
        deliveredAt: status === 'paid' ? date(o.updated_at) : null,
        promoCode: o.promo_code ?? null,
        source: external ? String(o.source).slice(0, 20) : 'storefront',
        utmSource: o.utm_source,
        utmMedium: o.utm_medium,
        utmCampaign: o.utm_campaign,
        referrer: o.referrer,
        eventId: randomToken(16),
        // Les effets (emails, CAPI) ont déjà eu lieu en v1 : on ne les rejoue pas.
        fulfilledEffectsAt: status === 'paid' ? new Date() : null,
        metadata: json<Row | null>(o.metadata, null),
        createdAt: created,
      })
      const product = productById.get(Number(o.product_id))
      await tx.insert(s.orderItems).values({
        orderId: Number(o.id),
        productId: product ? Number(o.product_id) : null,
        productType: 'digital',
        name: product?.name ?? 'Produit supprimé',
        quantity: 1,
        unitPrice: num(o.amount),
        total: num(o.amount),
      })
      await tx.insert(s.orderEvents).values({ orderId: Number(o.id), type: 'imported', message: 'Importée depuis Sellit v1', createdAt: created })
      bump('orders')
    }

    const seenRefs = new Set<string>()
    for (const t of txs) {
      // L'ancien code inventait des références (« feex_12 ») parfois dupliquées : on garde la première.
      const key = `${t.provider}:${t.provider_ref}`
      const ref = t.provider_ref && !seenRefs.has(key) ? t.provider_ref : null
      if (t.provider_ref) seenRefs.add(key)
      await tx.insert(s.paymentTransactions).values({
        orderId: Number(t.order_id),
        provider: t.provider,
        providerRef: ref,
        country: t.country?.slice(0, 2) ?? null,
        network: t.network?.slice(0, 30) ?? null,
        phone: t.phone?.slice(0, 30) ?? null,
        status: ['processing', 'otp_required', 'redirect', 'paid', 'failed'].includes(t.status) ? t.status : t.status === 'pending' ? 'processing' : 'failed',
        amount: num(t.amount),
        currency: t.currency ?? 'XOF',
        providerResponse: json(t.provider_response, null),
        webhookPayload: json(t.webhook_payload, null),
        errorMessage: t.error_message?.slice(0, 500) ?? null,
        createdAt: date(t.created_at),
      })
      bump('payment_transactions')
    }

    for (const l of leads) {
      await tx
        .insert(s.leads)
        .values({
          storeId: Number(l.store_id),
          productId: productById.has(Number(l.product_id)) ? Number(l.product_id) : null,
          email: l.customer_email?.toLowerCase() ?? null,
          phone: l.customer_phone ? normalizePhone(l.customer_phone).slice(0, 30) : null,
          name: l.customer_name,
          source: l.source ?? 'checkout',
          reminderCount: num(l.reminder_count),
          lastRemindedAt: l.last_reminded_at ? date(l.last_reminded_at) : null,
          nextReminderAt: null, // on ne relance pas d'anciens paniers après la migration
          convertedAt: l.converted_at ? date(l.converted_at) : null,
          reminderHistory: json(l.reminder_history, []),
          createdAt: date(l.created_at),
        })
        .onConflictDoNothing()
      bump('leads')
    }

    for (const d of clicks) {
      await tx.insert(s.downloads).values({ orderId: Number(d.order_id), productId: productById.has(Number(d.product_id)) ? Number(d.product_id) : null, createdAt: date(d.clicked_at) })
      bump('downloads')
    }

    // Événements de page : potentiellement volumineux → lots de 2 000.
    let lastId = 0
    for (;;) {
      const batch = await legacy`select * from page_events where id > ${lastId} order by id limit 2000`
      if (!batch.length) break
      await tx.insert(s.pageEvents).values(
        batch.map((e) => ({
          storeId: Number(e.store_id),
          productId: e.product_id && productById.has(Number(e.product_id)) ? Number(e.product_id) : null,
          eventType: e.event_type,
          sessionId: e.session_id,
          ipHash: e.ip_hash,
          referrer: e.referrer,
          utmSource: e.utm_source,
          utmMedium: e.utm_medium,
          utmCampaign: e.utm_campaign,
          deviceType: e.device_type,
          country: e.country,
          metadata: json(e.metadata, null),
          createdAt: date(e.created_at),
        })),
      )
      bump('page_events', batch.length)
      lastId = Number(batch[batch.length - 1]!.id)
    }

    // Les séquences reprennent après les ID importés.
    for (const table of ['users', 'stores', 'products', 'orders']) {
      await tx.execute(dsql.raw(`select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 0) + 1, false)`))
    }

    if (DRY_RUN) throw new DryRun()
  })
}

class DryRun extends Error {}

try {
  await main()
  console.log('✅ Import terminé')
} catch (e) {
  if (e instanceof DryRun) console.log('🧪 Simulation (--dry-run) : rien n’a été écrit')
  else {
    console.error('❌ Import annulé :', e instanceof Error ? e.message : e)
    process.exitCode = 1
  }
} finally {
  console.table(stats)
  if (warnings.length) console.warn(`⚠️  ${warnings.length} avertissement(s) :\n- ${warnings.join('\n- ')}`)
  await legacy.end()
  await target.end()
}
