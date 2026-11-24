/**
 * Liste de démarrage d'une boutique (sous /stores/:storeId/launch) : les étapes qui mènent à la première vente,
 * cochées d'après ce que le vendeur a réellement fait (produit, livraison ou paiement, notifications, visites, commande).
 */
import { sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { env } from '../lib/env'

export type LaunchStep = 'store' | 'product' | 'delivery' | 'payment' | 'notifications' | 'share' | 'order'

export const launchRoutes = new Hono<AppEnv>().get('/', requirePermission('products.edit'), async (c) => {
  const store = c.get('store')
  const user = c.get('user')
  const digital = store.kind === 'digital'
  const [r] = await db.execute<{ product: string | null; products: number; zones: number; accounts: number; push: number; visits: number; orders: number; digitalReady: number }>(dsql`
    select
      (select id from products where store_id = ${store.id} and is_active order by created_at limit 1) as product,
      (select count(*)::int from products where store_id = ${store.id} and is_active) as products,
      (select count(*)::int from delivery_zones where store_id = ${store.id} and is_active) as zones,
      (select count(*)::int from payment_accounts where store_id = ${store.id} and enabled) as accounts,
      (select count(*)::int from push_subscriptions where user_id = ${user.id}) as push,
      (select count(*)::int from page_events where store_id = ${store.id} and event_type = 'page_view') as visits,
      (select count(*)::int from orders where store_id = ${store.id} and source <> 'manual') as orders,
      (select count(*)::int from products where store_id = ${store.id} and is_active and type = 'digital' and delivery is not null) as "digitalReady"`)
  const x = r!
  const steps: { key: LaunchStep; done: boolean }[] = [
    { key: 'store', done: true },
    { key: 'product', done: digital ? x.digitalReady > 0 : x.products > 0 },
    // Physique : zones de livraison. Digital : un moyen d'encaisser en ligne (compte de paiement ou intégration).
    digital ? { key: 'payment', done: x.accounts > 0 } : { key: 'delivery', done: x.zones > 0 },
    { key: 'notifications', done: x.push > 0 },
    { key: 'share', done: x.visits > 0 },
    { key: 'order', done: x.orders > 0 },
  ]
  const base = env.STOREFRONT_URL.replace(/\/$/, '')
  return c.json({
    steps,
    done: steps.every((s) => s.done),
    kind: store.kind,
    storeUrl: `${base}/${store.slug}`,
    productUrl: x.product ? `${base}/${store.slug}/p/${x.product}` : null,
  })
})
