import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { htmlToPlain } from '../src/services/catalog-feed'
import { handleOf } from '../src/services/catalog-export'
import { Client } from './helpers'

/** Catalogue standard (Google Merchant, Meta, Shopify, WooCommerce) déduit des fiches, sans aucun champ à remplir. */
const owner = new Client()
const visitor = new Client()

describe('catalogue standard', () => {
  test('outils de texte', () => {
    expect(htmlToPlain('<p>Bonjour&nbsp;<strong>Awa</strong></p><ul><li>Un</li><li>Deux</li></ul>')).toBe('Bonjour Awa\n• Un\n• Deux')
    expect(handleOf('Perruque Brésilienne 30 cm', 'prd_AbCdEf123456')).toBe('perruque-bresilienne-30-cm-123456')
  })

  test('flux public et exports Shopify / WooCommerce', async () => {
    await db.insert(users).values({ email: 'catalogue@test.dev', name: 'Catalogue', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'catalogue@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Awa Beauté', slug: 'awa-beaute', currency: 'XOF' })).body.id
    await owner.post(`/api/stores/${s}/zones`, { name: 'Cotonou', country: 'BJ', cities: [], fee: 1500, freeAbove: null, codAllowed: true, etaLabel: null, isActive: true, position: 0 })
    await owner.post(`/api/stores/${s}/zones`, { name: 'Calavi', country: 'BJ', cities: [], fee: 1000, freeAbove: null, codAllowed: true, etaLabel: null, isActive: true, position: 1 })
    const wig = (
      await owner.post(`/api/stores/${s}/products`, {
        type: 'physical',
        name: 'Perruque Brésilienne',
        category: 'Perruques',
        isActive: true,
        price: 20000,
        promo: { type: 'percentage', value: 25 },
        description: '<p>Cheveux <strong>100 % naturels</strong>.</p>',
        sku: 'PER-01',
        weightGrams: 300,
        trackInventory: true,
        stock: 4,
        variantLabel: 'Longueur',
        variants: [
          { name: '30 cm', sku: 'PER-01-30', price: null, stock: 2, isActive: true },
          { name: '40 cm', sku: 'PER-01-40', price: 25000, stock: 0, isActive: true },
        ],
        content: { testimonials: [{ name: 'Awa', rating: 5, text: 'Superbe' }, { name: 'Fifi', rating: 4, text: 'Très bien' }] },
      })
    ).body.id
    const hidden = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Brouillon', isActive: false, price: 1000 })).body.id

    const cat = await visitor.get('/api/v1/stores/awa-beaute/catalog')
    expect(cat.status).toBe(200)
    expect(cat.body.items.map((i: { id: string }) => i.id)).toEqual([wig])
    const it = cat.body.items[0]
    expect(it).toMatchObject({
      sku: 'PER-01',
      title: 'Perruque Brésilienne',
      description: 'Cheveux 100 % naturels.',
      path: `/p/${wig}`,
      brand: 'Awa Beauté',
      condition: 'new',
      currency: 'XOF',
      price: 20000,
      salePrice: 15000,
      availability: 'in_stock',
      category: 'Perruques',
      shipping: [{ country: 'BJ', price: 1000 }],
      rating: { value: 4.5, count: 2 },
    })
    expect(it.variants.map((v: { sku: string; availability: string; price: number }) => [v.sku, v.availability, v.price])).toEqual([
      ['PER-01-30', 'in_stock', 20000],
      ['PER-01-40', 'out_of_stock', 25000],
    ])

    // Export Shopify : en-tête officiel, une ligne par variante, brouillon gardé en « draft ».
    const shop = await owner.req('GET', `/api/stores/${s}/products/export.csv?format=shopify`)
    expect(shop.status).toBe(200)
    const shopCsv = String(shop.body)
    expect(shopCsv).toContain('Handle,Title,Body (HTML),Vendor')
    expect(shopCsv).toContain('perruque-bresilienne-')
    expect(shopCsv).toContain('PER-01-40')
    expect(shopCsv).toContain(',draft')
    expect(shopCsv).toContain('Awa Beauté')

    // Export WooCommerce : produit variable + ses variations rattachées au parent.
    const woo = String((await owner.req('GET', `/api/stores/${s}/products/export.csv?format=woocommerce`)).body)
    expect(woo).toContain('ID,Type,SKU,Name,Published')
    expect(woo).toContain('variable,PER-01,Perruque Brésilienne')
    expect(woo).toContain('variation,PER-01-30')
    expect(woo.split('\n').some((l) => l.includes('variation,PER-01-40') && l.includes(',PER-01,'))).toBe(true)

    // Réservé aux membres de la boutique.
    expect((await visitor.req('GET', `/api/stores/${s}/products/export.csv`)).status).toBe(401)
    expect(hidden).toBeTruthy()
  })
})
