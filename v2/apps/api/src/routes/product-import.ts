/**
 * Import de produits (sous /stores/:storeId/products/import).
 * - CSV (modèle Zuri ou export Shopify) : aperçu puis import par lots.
 * - URL : module séparé, plus bas.
 */
import { productInputSchema } from '@zuri/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { badRequest } from '../lib/errors'
import { v } from '../lib/validate'
import { logActivity } from '../services/activity'
import { buildCandidates, CSV_TEMPLATE, detectFormat, guessMapping, IMPORT_FIELDS, MAX_IMPORT_PRODUCTS, parseCsv, type ColumnMapping, type ImportField } from '../services/csv-import'
import { imageImporter } from '../services/import-images'
import { createProduct } from '../services/product-write'

/** Aucun tiret long ou moyen dans les textes importés. */
const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, ', ')

export const productImportRoutes = new Hono<AppEnv>().use(requirePermission('products.edit'))

// ─── Import CSV ──────────────────────────────────────────────────────────────

const MAX_CSV_BYTES = 5 * 1024 * 1024
/** Produits traités par appel : l'interface enchaîne les lots (barre de progression). */
const MAX_COMMIT_BATCH = 50

/** UTF-8 (avec ou sans BOM), sinon Windows-1252 (fichiers enregistrés par Excel). */
function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

const mappingSchema = z.partialRecord(z.enum(Object.keys(IMPORT_FIELDS) as [ImportField, ...ImportField[]]), z.number().int().min(0).max(500))

/** Lit le fichier (multipart « file ») ou le texte JSON, avec la correspondance de colonnes éventuelle. */
async function readCsvRequest(c: { req: { header: (n: string) => string | undefined; formData: () => Promise<FormData>; json: () => Promise<unknown> } }) {
  let text: string
  let mapping: ColumnMapping | undefined
  if ((c.req.header('content-type') ?? '').includes('multipart/form-data')) {
    const form = await c.req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('Fichier manquant')
    if (file.size > MAX_CSV_BYTES) throw badRequest('Fichier trop lourd (5 Mo max)')
    text = decodeText(await file.arrayBuffer())
    const raw = form.get('mapping')
    if (typeof raw === 'string' && raw) mapping = mappingSchema.parse(JSON.parse(raw))
  } else {
    const body = z.object({ text: z.string().max(MAX_CSV_BYTES), mapping: mappingSchema.optional() }).parse(await c.req.json())
    text = body.text
    mapping = body.mapping
  }
  return { text, mapping }
}

const commitItemSchema = z.object({
  index: z.number().int().min(0),
  name: z.string(),
  type: z.enum(['physical', 'digital']),
  price: z.number().nullable(),
  compareAtPrice: z.number().nullable(),
  description: z.string().max(200_000),
  images: z.array(z.string().url().max(1000)).max(12),
  variantLabel: z.string().max(40).nullable(),
  variants: z.array(z.object({ name: z.string().max(80), price: z.number().nullable(), stock: z.number().int().nullable(), sku: z.string().max(60).nullable() })).max(50),
  stock: z.number().int().nullable(),
  sku: z.string().max(60).nullable(),
  payment: z.enum(['cod', 'native', 'integration']).nullable(),
})

productImportRoutes.get('/csv/template', (c) => {
  const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="modele-import-zuri.csv"')
  return c.body(`\uFEFF${CSV_TEMPLATE.map((r) => r.map(esc).join(',')).join('\n')}\n`)
})

/** Aperçu : produits détectés, erreurs et avertissements, correspondance des colonnes proposée. */
productImportRoutes.post('/csv/preview', async (c) => {
  const { text, mapping: given } = await readCsvRequest(c)
  const rows = parseCsv(text)
  if (rows.length < 2) throw badRequest('Le fichier est vide ou ne contient que l’en-tête')
  const headers = rows[0]!.map((h) => h.trim())
  const mapping = given ?? guessMapping(headers)
  if (mapping.name === undefined || mapping.price === undefined) {
    // On renvoie quand même les colonnes pour que l'utilisateur fasse la correspondance à la main.
    return c.json({ headers, mapping, format: detectFormat(headers), products: [], total: 0, needsMapping: true, fields: IMPORT_FIELDS })
  }
  const products = buildCandidates(rows, mapping)
  if (products.length > MAX_IMPORT_PRODUCTS) throw badRequest(`Trop de produits (${products.length}) : ${MAX_IMPORT_PRODUCTS} maximum par fichier`)
  return c.json({ headers, mapping, format: detectFormat(headers), products, total: products.length, needsMapping: false, fields: IMPORT_FIELDS })
})

/** Import d'un lot de produits (déjà vus dans l'aperçu). Tout est revalidé côté serveur. */
productImportRoutes.post('/csv/commit', v('json', z.object({ items: z.array(commitItemSchema).min(1).max(MAX_COMMIT_BATCH), activate: z.boolean().default(false) })), async (c) => {
  const { items, activate } = c.req.valid('json')
  const store = c.get('store')
  const access = c.get('access')
  const results: { index: number; ok: boolean; id?: string; name: string; error?: string; warnings: string[] }[] = []
  for (const item of items) {
    const warnings: string[] = []
    const images = item.images.length ? await imageImporter.run(store.id, item.images) : { coverImage: null, thumbnail: null, gallery: [], failed: [] }
    if (images.failed.length) warnings.push(`${images.failed.length} image(s) non récupérée(s)`)
    const hasStock = item.stock != null || item.variants.some((x) => x.stock != null)
    const parsed = productInputSchema.safeParse({
      type: item.type,
      name: noDash(item.name),
      isActive: activate,
      description: noDash(item.description),
      price: item.price ?? undefined,
      compareAtPrice: item.compareAtPrice,
      coverImage: images.coverImage,
      thumbnail: images.thumbnail,
      content: { gallery: item.type === 'physical' ? images.gallery : [] },
      // Physique : à la livraison sauf mention contraire ; digital : paiement en ligne.
      payment: { method: item.type === 'physical' && (item.payment ?? 'cod') === 'cod' ? 'cod' : 'native', integration: null },
      sku: item.variants.length ? null : item.sku,
      trackInventory: item.type === 'physical' && hasStock,
      stock: item.type === 'physical' && !item.variants.length ? item.stock : null,
      variantLabel: item.type === 'physical' ? item.variantLabel : null,
      variants:
        item.type === 'physical'
          ? item.variants.map((x) => ({ name: noDash(x.name), sku: x.sku, price: x.price, stock: x.stock, isActive: true }))
          : [],
    })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      results.push({ index: item.index, ok: false, name: item.name, error: issue ? `${issue.path.join('.') || 'produit'} : ${issue.message}` : 'Données invalides', warnings })
      continue
    }
    try {
      const id = await createProduct(access, store, parsed.data)
      results.push({ index: item.index, ok: true, id, name: item.name, warnings })
    } catch (e) {
      results.push({ index: item.index, ok: false, name: item.name, error: e instanceof Error ? e.message : 'Création impossible', warnings })
    }
  }
  const created = results.filter((r) => r.ok)
  if (created.length) {
    await logActivity(c, {
      entityType: 'product',
      action: 'imported',
      message: `${created.length} produit(s) importé(s) depuis un CSV`,
      productIds: created.map((r) => r.id!),
    })
  }
  return c.json({ results })
})

// ─── Import depuis une URL (autre module) ───
