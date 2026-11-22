/**
 * Paniers abandonnés (coordonnées laissées sans commande) : liste, relance immédiate par email, retrait.
 * La relance WhatsApp se fait depuis le tableau de bord (lien wa.me avec le lien de la page de vente).
 * Un membre limité à certains produits ne voit que les paniers de ses produits.
 */
import { and, desc, eq, ilike, inArray, isNull, or, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { leads, products } from '../db/schema'
import { requirePermission } from '../lib/auth'
import type { AppEnv, StoreAccess } from '../lib/context'
import { env } from '../lib/env'
import { badRequest, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { abandonedCartEmail } from '../services/emails'
import { sendEmail } from '../services/notify'

const PAGE = 50
const leadScope = (access: StoreAccess) => (access.productIds ? (access.productIds.length ? inArray(leads.productId, access.productIds) : dsql`false`) : undefined)
const productUrl = (slug: string, productId: string) => `${env.STOREFRONT_URL.replace(/\/$/, '')}/${slug}/p/${productId}`

export const leadRoutes = new Hono<AppEnv>()
  .get('/', requirePermission('orders.view'), v('query', z.object({ q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1) })), async (c) => {
    const store = c.get('store')
    const { q, page } = c.req.valid('query')
    const like = q ? `%${q.replace(/[%_]/g, '\\$&')}%` : null
    const where = and(eq(leads.storeId, store.id), isNull(leads.convertedAt), leadScope(c.get('access')), like ? or(ilike(leads.name, like), ilike(leads.email, like), ilike(leads.phone, like)) : undefined)
    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      db
        .select({ lead: leads, productName: products.name, price: products.price })
        .from(leads)
        .leftJoin(products, eq(products.id, leads.productId))
        .where(where)
        .orderBy(desc(leads.createdAt))
        .limit(PAGE)
        .offset((page - 1) * PAGE),
      db.select({ total: dsql<number>`count(*)::int` }).from(leads).where(where),
    ])
    return c.json({
      total,
      page,
      pageSize: PAGE,
      data: rows.map(({ lead, productName, price }) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        productId: lead.productId,
        productName,
        price,
        productUrl: lead.productId ? productUrl(store.slug, lead.productId) : null,
        reminderCount: lead.reminderCount,
        lastRemindedAt: lead.lastRemindedAt,
        createdAt: lead.createdAt,
      })),
    })
  })
  /** Relance immédiate par email (en plus des relances automatiques). */
  .post('/:id/remind', requirePermission('orders.update'), v('param', z.object({ id: z.coerce.number().int().positive() })), async (c) => {
    const store = c.get('store')
    const [row] = await db
      .select({ lead: leads, productName: products.name })
      .from(leads)
      .leftJoin(products, eq(products.id, leads.productId))
      .where(and(eq(leads.id, c.req.valid('param').id), eq(leads.storeId, store.id), isNull(leads.convertedAt), leadScope(c.get('access'))))
      .limit(1)
    if (!row) throw notFound('Panier')
    if (!row.lead.email) throw badRequest('Pas d’email pour ce client : relance-le par WhatsApp', 'no_email')
    if (!row.lead.productId) throw badRequest('Produit supprimé', 'no_product')
    const step = Math.min(row.lead.reminderCount + 1, 3)
    const mail = abandonedCartEmail({ step, storeName: store.name, name: row.lead.name, product: row.productName ?? 'votre produit', url: productUrl(store.slug, row.lead.productId) })
    await sendEmail(row.lead.email, mail.subject, mail.html, { fromName: store.name, replyTo: store.supportEmail })
    await db
      .update(leads)
      .set({ reminderCount: row.lead.reminderCount + 1, lastRemindedAt: new Date(), reminderHistory: [...row.lead.reminderHistory, { step, channel: 'email', at: new Date().toISOString() }] })
      .where(eq(leads.id, row.lead.id))
    return c.json({ ok: true })
  })
  /** Retirer un panier de la liste (client recontacté autrement, doublon…). */
  .delete('/:id', requirePermission('orders.update'), v('param', z.object({ id: z.coerce.number().int().positive() })), async (c) => {
    const [row] = await db
      .delete(leads)
      .where(and(eq(leads.id, c.req.valid('param').id), eq(leads.storeId, c.get('store').id), leadScope(c.get('access'))))
      .returning({ id: leads.id })
    if (!row) throw notFound('Panier')
    return c.json({ ok: true })
  })
