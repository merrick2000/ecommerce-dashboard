/**
 * Import CSV de produits : lecture du fichier, correspondance des colonnes, regroupement
 * (export Shopify : une ligne par variante/image, regroupées par « Handle »), validation.
 * Module PUR (aucun accès réseau ni base) : entièrement testable.
 */

// ─── Lecture CSV (RFC 4180 : guillemets, guillemets doublés, retours à la ligne dans les champs) ───

/** Séparateur le plus probable (« , » ou « ; ») d'après la première ligne, hors guillemets. */
export function detectDelimiter(text: string): ',' | ';' {
  let commas = 0
  let semis = 0
  let quoted = false
  for (const ch of text) {
    if (ch === '"') quoted = !quoted
    else if (!quoted && ch === '\n') break
    else if (!quoted && ch === ',') commas++
    else if (!quoted && ch === ';') semis++
  }
  return semis > commas ? ';' : ','
}

export function parseCsv(input: string, delimiter?: ',' | ';'): string[][] {
  const text = input.replace(/^﻿/, '')
  const sep = delimiter ?? detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"' && field === '') quoted = true
    else if (ch === sep) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  // Lignes entièrement vides ignorées.
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

// ─── Correspondance des colonnes ─────────────────────────────────────────────

export const IMPORT_FIELDS = {
  handle: 'Identifiant de regroupement (handle)',
  name: 'Nom',
  type: 'Type (physique / digital)',
  price: 'Prix',
  compareAtPrice: 'Prix barré',
  description: 'Description',
  images: 'Images (URL, séparées par |)',
  variantLabel: 'Nom de la variante (ex. Couleur)',
  variantValues: 'Valeurs de variante (séparées par |)',
  stock: 'Stock',
  sku: 'SKU',
  active: 'Actif',
  payment: 'Paiement (cod / native / integration)',
} as const
export type ImportField = keyof typeof IMPORT_FIELDS
export type ColumnMapping = Partial<Record<ImportField, number>>

const norm = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Noms de colonnes reconnus (modèle Zuri, export Shopify, variantes courantes FR/EN). */
const ALIASES: Record<ImportField, string[]> = {
  handle: ['handle', 'slug', 'identifiant'],
  name: ['nom', 'name', 'title', 'titre', 'product name', 'nom du produit', 'produit'],
  type: ['type', 'type de produit'],
  price: ['prix', 'price', 'variant price', 'prix de vente', 'tarif'],
  compareAtPrice: ['prix barre', 'compare at price', 'variant compare at price', 'ancien prix', 'old price', 'regular price'],
  description: ['description', 'body html', 'body', 'descriptif'],
  images: ['images', 'image src', 'image', 'image url', 'photos', 'photo', 'images url'],
  variantLabel: ['variante nom', 'option1 name', 'variant name', 'option'],
  variantValues: ['variante valeurs', 'option1 value', 'variant values', 'valeurs'],
  stock: ['stock', 'variant inventory qty', 'quantite', 'quantity', 'inventory'],
  sku: ['sku', 'variant sku', 'reference', 'ref'],
  active: ['actif', 'active', 'published', 'status', 'publie', 'statut'],
  payment: ['paiement', 'payment', 'mode de paiement'],
}

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normalized = headers.map(norm)
  for (const field of Object.keys(ALIASES) as ImportField[]) {
    const idx = normalized.findIndex((h) => ALIASES[field].includes(h))
    if (idx !== -1 && !Object.values(mapping).includes(idx)) mapping[field] = idx
  }
  return mapping
}

export function detectFormat(headers: string[]): 'shopify' | 'zuri' | 'generic' {
  const h = headers.map(norm)
  if (h.includes('handle') && h.includes('variant price')) return 'shopify'
  if (h.includes('nom') && h.includes('prix')) return 'zuri'
  return 'generic'
}

// ─── Produits détectés ───────────────────────────────────────────────────────

export interface ImportVariant {
  name: string
  price: number | null
  stock: number | null
  sku: string | null
}

export interface ImportCandidate {
  /** Rang dans l'aperçu (sert d'identifiant côté interface). */
  index: number
  /** Lignes du fichier (numérotées à partir de 2 : la ligne 1 est l'en-tête). */
  lines: number[]
  name: string
  type: 'physical' | 'digital'
  price: number | null
  compareAtPrice: number | null
  description: string
  images: string[]
  variantLabel: string | null
  variants: ImportVariant[]
  stock: number | null
  sku: string | null
  isActive: boolean | null
  payment: 'cod' | 'native' | 'integration' | null
  errors: string[]
  warnings: string[]
}

/** « 15 000 », « 15000 FCFA », « 12,50 », « 1.299,90 » → nombre ; null si vide ou illisible. */
export function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null
  let s = raw.replace(/[^\d.,-]/g, '')
  if (!s || !/\d/.test(s)) return null
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // Les deux : le dernier séparateur est la décimale, l'autre sert aux milliers.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    // « 15,000 » / « 1,250,000 » = milliers ; « 12,50 » = décimale.
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // « 15.000 » = milliers (notation courante en Afrique de l'Ouest).
    s = s.replace(/\./g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const parseIntOrNull = (raw: string | undefined) => {
  if (!raw?.trim()) return null
  const n = Number.parseInt(raw.replace(/\s/g, ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function parseBool(raw: string | undefined): boolean | null {
  const v = norm(raw ?? '')
  if (!v) return null
  if (['oui', 'yes', 'true', '1', 'vrai', 'actif', 'active', 'publie'].includes(v)) return true
  if (['non', 'no', 'false', '0', 'faux', 'inactif', 'draft', 'archived', 'brouillon'].includes(v)) return false
  return null
}

function parseType(raw: string | undefined): 'physical' | 'digital' | null {
  const v = norm(raw ?? '')
  if (!v) return null
  if (['digital', 'numerique', 'digitale', 'virtuel', 'ebook', 'formation'].includes(v)) return 'digital'
  if (['physique', 'physical', 'physic', 'produit physique'].includes(v)) return 'physical'
  return null
}

function parsePayment(raw: string | undefined): ImportCandidate['payment'] {
  const v = norm(raw ?? '')
  if (!v) return null
  if (['cod', 'livraison', 'paiement a la livraison', 'cash on delivery'].includes(v)) return 'cod'
  if (['native', 'en ligne', 'online', 'mobile money'].includes(v)) return 'native'
  if (['integration', 'lien', 'externe'].includes(v)) return 'integration'
  return null
}

const splitList = (raw: string | undefined) =>
  (raw ?? '')
    .split(/\s*[|\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

/** Texte brut → paragraphes HTML ; le HTML existant (export Shopify) est gardé tel quel (nettoyé à l'écriture). */
function toHtml(text: string): string {
  const t = text.trim()
  if (!t) return ''
  if (/<[a-z][\s\S]*>/i.test(t)) return t
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return t
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export const MAX_IMPORT_PRODUCTS = 500
const MAX_IMAGES = 12
const MAX_VARIANTS = 50

/**
 * Transforme les lignes du CSV en produits. Avec une colonne « handle », les lignes de même
 * handle forment un seul produit (variantes + images) ; sinon chaque ligne est un produit.
 */
export function buildCandidates(rows: string[][], mapping: ColumnMapping): ImportCandidate[] {
  const [, ...data] = rows
  const get = (r: string[], f: ImportField) => (mapping[f] !== undefined ? (r[mapping[f]!] ?? '').trim() : '')
  const groups: { key: string; lines: number[]; rows: string[][] }[] = []
  const byHandle = new Map<string, (typeof groups)[number]>()
  data.forEach((r, i) => {
    const line = i + 2
    const handle = get(r, 'handle')
    if (mapping.handle !== undefined && handle) {
      let g = byHandle.get(handle)
      if (!g) {
        g = { key: handle, lines: [], rows: [] }
        byHandle.set(handle, g)
        groups.push(g)
      }
      g.lines.push(line)
      g.rows.push(r)
    } else groups.push({ key: `l${line}`, lines: [line], rows: [r] })
  })

  return groups.map((g, index) => {
    const first = g.rows[0]!
    const errors: string[] = []
    const warnings: string[] = []
    // Champs « produit » : la première ligne non vide du groupe fait foi (Shopify ne les répète pas).
    const pick = (f: ImportField) => g.rows.map((r) => get(r, f)).find(Boolean) ?? ''
    const name = pick('name')
    const price = parsePrice(pick('price'))
    const type = parseType(pick('type')) ?? 'physical'
    if (pick('type') && !parseType(pick('type'))) warnings.push(`Type « ${pick('type')} » non reconnu : produit physique par défaut`)

    // Images : toutes celles du groupe, sans doublon.
    const images: string[] = []
    for (const r of g.rows) {
      for (const url of splitList(get(r, 'images'))) {
        if (!/^https?:\/\//i.test(url)) {
          warnings.push(`Image ignorée (adresse invalide) : ${url.slice(0, 60)}`)
          continue
        }
        if (!images.includes(url)) images.push(url)
      }
    }
    if (images.length > MAX_IMAGES) {
      warnings.push(`${images.length} images : seules les ${MAX_IMAGES} premières seront importées`)
      images.length = MAX_IMAGES
    }

    // Variantes : une valeur par ligne (Shopify) ou plusieurs valeurs séparées par | (modèle Zuri).
    const variants: ImportVariant[] = []
    for (const r of g.rows) {
      const values = splitList(get(r, 'variantValues'))
      const rowPrice = parsePrice(get(r, 'price'))
      for (const v of values) {
        if (norm(v) === 'default title' || variants.some((x) => x.name === v)) continue
        variants.push({
          name: v.slice(0, 80),
          // Prix propre à la variante seulement s'il diffère du prix du produit.
          price: values.length === 1 && rowPrice != null && price != null && rowPrice !== price ? rowPrice : null,
          stock: values.length === 1 ? parseIntOrNull(get(r, 'stock')) : null,
          sku: values.length === 1 ? get(r, 'sku') || null : null,
        })
      }
    }
    if (variants.length > MAX_VARIANTS) {
      warnings.push(`${variants.length} variantes : seules les ${MAX_VARIANTS} premières seront importées`)
      variants.length = MAX_VARIANTS
    }
    const variantLabel = variants.length ? (pick('variantLabel') || 'Option').slice(0, 40) : null

    let payment = parsePayment(pick('payment'))
    if (pick('payment') && !payment) warnings.push(`Paiement « ${pick('payment')} » non reconnu : réglage par défaut`)
    if (type === 'digital' && payment === 'cod') {
      warnings.push('Paiement à la livraison impossible pour un produit digital : paiement en ligne')
      payment = 'native'
    }
    if (payment === 'integration') {
      warnings.push('Intégration externe : à compléter dans l’éditeur du produit (paiement en ligne en attendant)')
      payment = 'native'
    }

    if (name.length < 2) errors.push('Nom manquant')
    else if (name.length > 160) errors.push('Nom trop long (160 caractères max)')
    if (price === null) errors.push('Prix manquant ou illisible')
    const compareAtPrice = parsePrice(pick('compareAtPrice'))
    if (compareAtPrice != null && price != null && compareAtPrice <= price) warnings.push('Prix barré inférieur ou égal au prix : ignoré')
    if (!images.length) warnings.push('Aucune image')

    const stock = variants.length ? null : parseIntOrNull(pick('stock'))
    return {
      index,
      lines: g.lines,
      name: name.slice(0, 160),
      type,
      price,
      compareAtPrice: compareAtPrice != null && price != null && compareAtPrice > price ? compareAtPrice : null,
      description: toHtml(pick('description')),
      images,
      variantLabel,
      variants,
      stock,
      sku: variants.length ? null : pick('sku') || null,
      isActive: parseBool(pick('active')),
      payment,
      errors,
      warnings,
    } satisfies ImportCandidate
  })
}

/** Modèle CSV Zuri (téléchargeable depuis le dashboard). */
export const CSV_TEMPLATE = [
  ['nom', 'type', 'prix', 'prix_barre', 'description', 'images', 'variante_nom', 'variante_valeurs', 'stock', 'sku', 'actif', 'paiement'],
  ['Montre connectée X1', 'physique', '15000', '20000', 'Suivi du sommeil, notifications, 7 jours d’autonomie.', 'https://exemple.com/montre-1.jpg|https://exemple.com/montre-2.jpg', 'Couleur', 'Noir|Or|Argent', '30', 'MX1', 'oui', 'cod'],
  ['Formation Excel', 'digital', '9900', '', 'De zéro à expert en 10 leçons vidéo.', 'https://exemple.com/excel.jpg', '', '', '', '', 'non', 'native'],
]
