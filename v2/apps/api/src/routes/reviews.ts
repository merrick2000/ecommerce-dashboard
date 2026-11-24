/**
 * Avis des vendeurs sur Zuri (sous /api/reviews) : « Recommanderiez-vous Zuri ? » posé dans le tableau de bord
 * après les premières ventes. Les notes basses alertent le super admin ; les témoignages publiables attendent sa validation.
 */
import { eq, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { sellerReviews } from '../db/schema'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { v } from '../lib/validate'
import { enqueue } from '../jobs/queue'

/** Le vendeur a déjà vécu Zuri : au moins une vente payée ou livrée (hors saisie manuelle) dans une de ses boutiques. */
async function eligible(userId: number): Promise<{ ok: boolean; storeUrl: string | null }> {
  const [r] = await db.execute<{ n: number; slug: string | null }>(dsql`
    select count(o.id)::int as n, min(s.slug) as slug
    from store_members m join stores s on s.id = m.store_id and m.role = 'owner'
    left join orders o on o.store_id = s.id and o.source <> 'manual' and (o.payment_status = 'paid' or o.fulfillment_status = 'delivered')
    where m.user_id = ${userId}`)
  return { ok: (r?.n ?? 0) > 0, storeUrl: r?.slug ? `https://${r.slug}.zurisell.store` : null }
}

export const reviewRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => {
    const user = c.get('user')
    const [review] = await db.select().from(sellerReviews).where(eq(sellerReviews.userId, user.id)).limit(1)
    // Déjà répondu ou écarté : on ne repose pas la question.
    if (review) return c.json({ ask: false, review })
    return c.json({ ask: (await eligible(user.id)).ok, review: null })
  })
  .post(
    '/',
    v(
      'json',
      z.object({
        score: z.number().int().min(0).max(10),
        comment: z.string().trim().max(1000).optional(),
        consent: z.boolean().default(false),
        publishName: z.string().trim().max(80).optional(),
        publishRole: z.string().trim().max(120).optional(),
      }),
    ),
    async (c) => {
      const user = c.get('user')
      const b = c.req.valid('json')
      const { storeUrl } = await eligible(user.id)
      const publishable = b.consent && b.score >= 7 && !!b.comment && b.comment.length >= 10
      const values = {
        score: b.score,
        comment: b.comment || null,
        consent: b.consent,
        publishName: b.publishName || user.name.split(' ')[0] || null,
        publishRole: b.publishRole || null,
        storeUrl,
        status: publishable ? 'pending' : 'private',
        updatedAt: new Date(),
      }
      await db.insert(sellerReviews).values({ userId: user.id, ...values }).onConflictDoUpdate({ target: sellerReviews.userId, set: values })
      if (b.score <= 6) {
        await enqueue('admin.notify', { title: `Avis à ${b.score}/10 de ${user.name}`, body: b.comment ? b.comment.slice(0, 140) : 'Sans commentaire. À rappeler pour comprendre ce qui bloque.', path: `/admin/users/${user.id}`, tag: `review-${user.id}` })
      } else if (publishable) {
        await enqueue('admin.notify', { title: `Témoignage à valider (${b.score}/10)`, body: `${user.name} : ${b.comment!.slice(0, 120)}`, path: '/admin/reviews', tag: `review-${user.id}` })
      }
      return c.json({ ok: true, status: values.status })
    },
  )
  /** « Plus tard » : la question n'est plus posée. */
  .post('/dismiss', async (c) => {
    const user = c.get('user')
    await db.insert(sellerReviews).values({ userId: user.id, status: 'dismissed' }).onConflictDoNothing()
    return c.json({ ok: true })
  })
