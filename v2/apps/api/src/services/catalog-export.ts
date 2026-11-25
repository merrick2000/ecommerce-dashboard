/**
 * Exports CSV aux formats officiels d'import de Shopify et de WooCommerce, depuis le catalogue normalisé.
 * Le fichier se réimporte tel quel dans Shopify (Produits > Importer) ou WooCommerce (Produits > Importer).
 */
import type { CatalogItem } from './catalog-feed'

/** Cellule CSV (virgule) : guillemets si besoin, formules Excel neutralisées. */
function cell(v: unknown): string {
  const s = v == null ? '' : String(v)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
const csv = (header: string[], rows: unknown[][]) => `﻿${[header, ...rows].map((r) => r.map(cell).join(',')).join('\n')}\n`

/** Identifiant d'URL lisible (« handle » Shopify). */
export function handleOf(title: string, id: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base ? `${base}-${id.slice(-6).toLowerCase()}` : id.toLowerCase()
}

const SHOPIFY_HEADER = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
  'Variant Requires Shipping', 'Variant Taxable', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
  'SEO Title', 'SEO Description', 'Status',
]

export function toShopifyCsv(items: CatalogItem[], opts: { activeIds?: Set<string> } = {}): string {
  const rows: unknown[][] = []
  for (const p of items) {
    const handle = handleOf(p.title, p.id)
    const status = !opts.activeIds || opts.activeIds.has(p.id) ? 'active' : 'draft'
    const variants = p.variants.length
      ? p.variants.map((v) => ({ option: v.title, sku: v.sku, price: v.salePrice ?? v.price, compare: v.salePrice != null ? v.price : null, qty: v.inventory }))
      : [{ option: 'Default Title', sku: p.sku, price: p.salePrice ?? p.price, compare: p.salePrice != null ? p.price : null, qty: p.inventory }]
    const lines = Math.max(variants.length, p.images.length, 1)
    for (let i = 0; i < lines; i++) {
      const v = variants[i]
      const img = p.images[i]
      const first = i === 0
      rows.push([
        handle,
        first ? p.title : '',
        first ? p.descriptionHtml || p.description : '',
        first ? p.brand : '',
        '',
        first ? (p.category ?? '') : '',
        first ? (p.type === 'digital' ? 'digital' : '') : '',
        first ? 'TRUE' : '',
        first ? (p.variants.length ? p.variantLabel || 'Option' : 'Title') : '',
        v ? v.option : '',
        v ? v.sku : '',
        v ? (p.type === 'physical' ? (p.weightGrams ?? 0) : 0) : '',
        v ? (v.qty != null ? 'shopify' : '') : '',
        v ? (v.qty ?? '') : '',
        v ? 'deny' : '',
        v ? 'manual' : '',
        v ? v.price : '',
        v ? (v.compare ?? '') : '',
        v ? (p.type === 'physical' ? 'TRUE' : 'FALSE') : '',
        v ? 'FALSE' : '',
        img ?? '',
        img ? i + 1 : '',
        img ? p.title : '',
        first ? 'FALSE' : '',
        first ? p.title : '',
        first ? p.description.slice(0, 320) : '',
        first ? status : '',
      ])
    }
  }
  return csv(SHOPIFY_HEADER, rows)
}

const WOO_HEADER = [
  'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog', 'Short description', 'Description',
  'Tax status', 'In stock?', 'Stock', 'Sale price', 'Regular price', 'Categories', 'Tags', 'Images', 'Parent',
  'Attribute 1 name', 'Attribute 1 value(s)', 'Attribute 1 visible', 'Attribute 1 global', 'Weight (kg)', 'Virtual', 'Brands',
]

export function toWooCommerceCsv(items: CatalogItem[], opts: { activeIds?: Set<string> } = {}): string {
  const rows: unknown[][] = []
  for (const p of items) {
    const published = !opts.activeIds || opts.activeIds.has(p.id) ? 1 : 0
    const variable = p.variants.length > 0
    const kg = p.type === 'physical' && p.weightGrams ? Math.round(p.weightGrams) / 1000 : ''
    rows.push([
      '',
      variable ? 'variable' : 'simple',
      p.sku,
      p.title,
      published,
      0,
      'visible',
      p.description.slice(0, 300),
      p.descriptionHtml || p.description,
      'none',
      p.availability === 'in_stock' ? 1 : 0,
      variable ? '' : (p.inventory ?? ''),
      variable ? '' : (p.salePrice ?? ''),
      variable ? '' : p.price,
      p.category ?? '',
      p.type === 'digital' ? 'digital' : '',
      p.images.join(', '),
      '',
      variable ? p.variantLabel || 'Option' : '',
      variable ? p.variants.map((v) => v.title.replace(/,/g, ' ')).join(', ') : '',
      variable ? 1 : '',
      variable ? 0 : '',
      kg,
      p.type === 'digital' ? 1 : 0,
      p.brand,
    ])
    for (const v of p.variants) {
      rows.push([
        '',
        'variation',
        v.sku,
        `${p.title} - ${v.title}`,
        published,
        0,
        'visible',
        '',
        '',
        'none',
        v.availability === 'in_stock' ? 1 : 0,
        v.inventory ?? '',
        v.salePrice ?? '',
        v.price,
        '',
        '',
        '',
        p.sku,
        p.variantLabel || 'Option',
        v.title.replace(/,/g, ' '),
        '',
        0,
        kg,
        p.type === 'digital' ? 1 : 0,
        '',
      ])
    }
  }
  return csv(WOO_HEADER, rows)
}
