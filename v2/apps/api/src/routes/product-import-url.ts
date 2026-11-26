/**
 * Import d'un produit depuis une URL (sous /stores/:storeId/products/import/url).
 * 1. preview : analyse la page, renvoie un brouillon (rien n'est créé, aucune image téléchargée).
 * 2. improve : suggestions IA facultatives (kie.ai).
 * 3. commit : rapatrie les images choisies et crée le produit (inactif par défaut).
 */
import { productInputSchema } from '@zuri/shared'
import { Hono } from 'hono'
import { assertFeature, planForStore } from '../services/platform'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { badRequest } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { maybeTask } from '../services/tasks'
import { logActivity } from '../services/activity'
import { aiAvailable, suggestImprovements } from '../services/ai-suggest'
import { createProduct } from '../services/product-write'
import { importRemoteImage } from '../services/remote'
import { descriptionImages } from '../services/ai-description'
import { publicUrl } from '../services/storage'
import { previewFromText, previewFromUrl, stripTags } from '../services/url-import'
import { firecrawlAvailable } from '../services/page-fetch'
import { resolveFeatures } from '../services/platform'
import { HttpError } from '../lib/errors'

/** Aucun tiret long ou moyen dans les textes importés ou proposés par l'IA. */
const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, ', ')

const draftSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().max(200_000).default(''),
  price: z.coerce.number().min(0).max(1_000_000_000),
  compareAtPrice: z.coerce.number().min(0).max(1_000_000_000).nullable().default(null),
  variantLabel: z.string().max(40).nullable().default(null),
  variants: z
    .array(z.object({ name: z.string().trim().min(1).max(80), price: z.coerce.number().min(0).nullable().default(null), available: z.boolean().default(true), sku: z.string().max(60).nullable().default(null) }))
    .max(50)
    .default([]),
  video: z.string().url().max(500).nullable().default(null),
  features: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(3000) })).max(40).default([]),
  testimonials: z.array(z.object({ name: z.string().trim().min(1).max(80), rating: z.coerce.number().int().min(1).max(5).default(5), text: z.string().trim().min(1).max(1000) })).max(40).default([]),
  kicker: z.string().max(80).optional(),
  headline: z.string().max(160).optional(),
  tagline: z.string().max(300).optional(),
})

export const productImportUrlRoutes = new Hono<AppEnv>()
  .use(requirePermission('products.edit'))
  // Import par lien (navigateur distant + IA, coûteux) : ouvert par le super admin, globalement ou compte par compte.
  .use(async (c, next) => {
    if (c.req.path.endsWith('/config')) return next()
    if (!(await resolveFeatures(c.get('user'))).urlImport) throw new HttpError(403, 'L’import par lien n’est pas encore ouvert sur ton compte.', 'url_import_disabled')
    await next()
  })
  /** Fonctions disponibles (le bouton « Proposer des améliorations » n'apparaît que si l'IA est configurée). */
  .get('/config', async (c) => c.json({ aiAvailable: aiAvailable(), browserAvailable: await firecrawlAvailable(), enabled: (await resolveFeatures(c.get('user'))).urlImport }))
  .post('/preview', rateLimit({ key: 'import-url', limit: 20, windowSec: 600 }), v('json', z.object({ url: z.string().trim().url().max(2000) })), async (c) => {
    await assertFeature(await planForStore(c.get('store').id), 'aiImport')
    const { url } = c.req.valid('json')
    const store = c.get('store')
    return maybeTask(c, async () => ({ ...(await previewFromUrl(url, store.currency, store.kind)), aiAvailable: aiAvailable() }))
  })
  /** Secours quand un site bloque toute lecture : le vendeur colle le texte de la page, l'IA remplit la fiche. */
  .post(
    '/preview-text',
    rateLimit({ key: 'import-url', limit: 20, windowSec: 600 }),
    v('json', z.object({ text: z.string().trim().min(40, 'Colle le contenu de la page produit').max(60_000), url: z.string().trim().url().max(2000).nullable().optional() })),
    async (c) => {
      await assertFeature(await planForStore(c.get('store').id), 'aiImport')
      if (!aiAvailable()) throw badRequest('Analyse IA non configurée', 'ai_unavailable')
      const { text, url } = c.req.valid('json')
      const store = c.get('store')
      return maybeTask(c, async () => ({ ...(await previewFromText(text, store.currency, url ?? null, store.kind)), aiAvailable: true }))
    },
  )
  .post(
    '/improve',
    rateLimit({ key: 'import-ai', limit: 15, windowSec: 600 }),
    v('json', z.object({ draft: draftSchema.partial({ price: true }).extend({ name: z.string().max(160) }), currency: z.string().max(3).nullable().optional(), brand: z.string().max(80).nullable().optional(), goal: z.string().max(300).optional() })),
    async (c) => {
      const { draft, currency, brand, goal } = c.req.valid('json')
      return maybeTask(c, async () => {
        const s = await suggestImprovements({
          name: draft.name,
          description: stripTags(draft.description ?? ''),
          price: draft.price ?? null,
          currency: currency ?? null,
          storeCurrency: c.get('store').currency,
          features: draft.features ?? [],
          variants: (draft.variants ?? []).map((x) => x.name),
          brand: brand ?? null,
          goal,
      })
      // Sortie du modèle : HTML nettoyé et ponctuation conforme, comme tout contenu vendeur.
      return {
        name: noDash(s.name),
        kicker: noDash(s.kicker),
        headline: noDash(s.headline),
        tagline: noDash(s.tagline),
        features: s.features.map(noDash).filter(Boolean),
        faqs: s.faqs.map((f) => ({ question: noDash(f.question), answer: noDash(f.answer) })).filter((f) => f.question && f.answer),
      }
      })
    },
  )
  .post(
    '/commit',
    rateLimit({ key: 'import-commit', limit: 30, windowSec: 600 }),
    v('json', z.object({ draft: draftSchema, imageUrls: z.array(z.string().url().max(2000)).max(60).default([]), activate: z.boolean().default(false), sourceUrl: z.string().url().max(2000).optional() })),
    async (c) => {
      const store = c.get('store')
      const { draft, imageUrls, activate, sourceUrl } = c.req.valid('json')
      return maybeTask(c, async () => {
        const warnings: string[] = []
        if (new Set(imageUrls).size > 13) warnings.push('Seules les 13 premières images ont été gardées (une couverture et 12 dans la galerie).')

        // Images : 1re = couverture (et miniature), suivantes = galerie ; 3 téléchargements à la fois.
        const urls = [...new Set(imageUrls)].slice(0, 13)
        const stored: (string | null)[] = new Array(urls.length).fill(null)
        let thumbnail: string | null = null
        const jobs = urls.map((u, i) => async () => {
          try {
            stored[i] = await importRemoteImage(store.id, u, i === 0 ? 'cover' : 'gallery')
            if (i === 0) thumbnail = await importRemoteImage(store.id, u, 'thumbnail').catch(() => stored[0] ?? null)
          } catch {
            warnings.push(`Image ${i + 1} non importée (inaccessible ou format non supporté).`)
          }
        })
        for (let k = 0; k < jobs.length; k += 3) await Promise.all(jobs.slice(k, k + 3).map((j) => j()))
        const images = stored.filter((x): x is string => !!x)
        const cover = images[0] ?? null

        // Images de la description gardées depuis le site source : copiées chez nous (elles peuvent disparaître).
        const ours = (publicUrl('x') ?? '').slice(0, -1)
        let description = draft.description
        const remote = descriptionImages(description).filter((i) => !ours || !i.src.startsWith(ours)).slice(0, 12)
        for (let k = 0; k < remote.length; k += 3) {
          await Promise.all(
            remote.slice(k, k + 3).map(async ({ src }) => {
              try {
                const url = await importRemoteImage(store.id, src, 'gallery')
                description = description.split(src).join(url).split(src.replace(/&/g, '&amp;')).join(url)
              } catch {
                warnings.push('Une image de la description n’a pas pu être copiée : elle reste chargée depuis le site source.')
              }
            }),
          )
        }

        const parsed = productInputSchema.safeParse({
          type: store.kind === 'digital' ? 'digital' : 'physical',
          name: noDash(draft.name),
          isActive: activate,
          description: noDash(description),
          price: draft.price,
          compareAtPrice: draft.compareAtPrice != null && draft.compareAtPrice > draft.price ? draft.compareAtPrice : null,
          coverImage: cover,
          thumbnail: thumbnail ?? cover,
          // Produit digital : ni variantes ni stock (les formules se décrivent dans la page).
          variantLabel: store.kind !== 'digital' && draft.variants.length ? (draft.variantLabel ?? 'Option') : null,
          variants: store.kind === 'digital' ? [] : draft.variants.map((x) => ({ name: noDash(x.name).slice(0, 80), sku: x.sku, price: x.price, isActive: x.available })),
          content: {
            gallery: images.slice(1, 13),
            features: draft.features.map(noDash),
            faqs: draft.faqs.map((f) => ({ question: noDash(f.question), answer: noDash(f.answer) })),
            testimonials: draft.testimonials.map((t) => ({ ...t, text: noDash(t.text) })),
            video: draft.video ? { url: draft.video, position: 'before_description' } : null,
            kicker: draft.kicker ? noDash(draft.kicker) : undefined,
            headline: draft.headline ? noDash(draft.headline) : undefined,
            tagline: draft.tagline ? noDash(draft.tagline) : undefined,
          },
        })
        if (!parsed.success) throw badRequest(`Produit invalide : ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message ?? ''}`.trim())

        const id = await createProduct(c.get('access'), store, parsed.data)
        const domain = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : null
        await logActivity(c, { entityType: 'product', entityId: id, entityLabel: parsed.data.name, action: 'imported', message: domain ? `Produit importé depuis ${domain}` : 'Produit importé depuis une URL', productIds: [id] })
        return { id, warnings, images: images.length }
      }, 201)
    },
  )
