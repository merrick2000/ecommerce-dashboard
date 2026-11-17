import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { productVariants, products, storeInvitations, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { buildCandidates, detectDelimiter, guessMapping, parseCsv, parsePrice } from '../src/services/csv-import'
import { imageImporter } from '../src/services/import-images'
import { Client } from './helpers'

// Aucune image téléchargée en test : on simule le rapatriement.
const realImporter = imageImporter.run
const downloaded: string[][] = []
imageImporter.run = async (_storeId, urls) => {
  downloaded.push(urls)
  const ok = urls.filter((u) => !u.includes('cassee'))
  return { coverImage: ok[0] ? `https://cdn.test/${ok[0].split('/').pop()}` : null, thumbnail: ok[0] ? 'https://cdn.test/thumb.webp' : null, gallery: ok.slice(1).map((u) => `https://cdn.test/${u.split('/').pop()}`), failed: urls.filter((u) => u.includes('cassee')) }
}
afterAll(() => {
  imageImporter.run = realImporter
})

describe('lecture CSV', () => {
  test('guillemets, guillemets doublés, retours à la ligne, BOM', () => {
    const rows = parseCsv('﻿nom,description\n"Montre ""X1""","Ligne 1\nLigne 2, avec virgule"\n')
    expect(rows).toEqual([
      ['nom', 'description'],
      ['Montre "X1"', 'Ligne 1\nLigne 2, avec virgule'],
    ])
  })

  test('séparateur « ; » détecté (Excel français), lignes vides ignorées', () => {
    const text = 'nom;prix\r\nSac;15 000\r\n\r\nChapeau;"12,50"\r\n'
    expect(detectDelimiter(text)).toBe(';')
    expect(parseCsv(text)).toEqual([
      ['nom', 'prix'],
      ['Sac', '15 000'],
      ['Chapeau', '12,50'],
    ])
  })

  test('prix lisibles dans tous les formats courants', () => {
    expect(parsePrice('15 000 FCFA')).toBe(15000)
    expect(parsePrice('1.299,90')).toBe(1299.9)
    expect(parsePrice('15.000')).toBe(15000)
    expect(parsePrice('')).toBeNull()
  })
})

describe('produits détectés', () => {
  test('modèle Zuri : variantes séparées par |, erreurs et avertissements', () => {
    const rows = parseCsv(
      [
        'nom,type,prix,prix_barre,images,variante_nom,variante_valeurs,stock,paiement',
        'Montre,physique,15000,20000,https://a.test/1.jpg|pas-une-url,Couleur,Noir|Or,10,cod',
        ',physique,5000,,,,,,',
        'Ebook,digital,abc,,,,,,cod',
      ].join('\n'),
    )
    const [montre, sansNom, ebook] = buildCandidates(rows, guessMapping(rows[0]!))
    expect(montre).toMatchObject({ name: 'Montre', price: 15000, compareAtPrice: 20000, variantLabel: 'Couleur', images: ['https://a.test/1.jpg'], errors: [] })
    expect(montre!.variants.map((v) => v.name)).toEqual(['Noir', 'Or'])
    expect(montre!.warnings.some((w) => w.includes('Image ignorée'))).toBe(true)
    expect(sansNom!.errors).toContain('Nom manquant')
    expect(ebook!.errors).toContain('Prix manquant ou illisible')
    expect(ebook!.payment).toBe('native') // pas de livraison pour un digital
  })

  test('export Shopify : lignes regroupées par Handle (variantes, prix propres, images)', () => {
    const rows = parseCsv(
      [
        'Handle,Title,Body (HTML),Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Compare At Price,Variant Inventory Qty,Image Src,Published',
        'tshirt,T-shirt Zuri,<p>Coton bio</p>,Taille,S,TS-S,5000,7000,4,https://s.test/t1.jpg,TRUE',
        'tshirt,,,,M,TS-M,5000,,6,https://s.test/t2.jpg,',
        'tshirt,,,,XL,TS-XL,6000,,0,,',
        'casquette,Casquette,,Title,Default Title,,3000,,,https://s.test/c.jpg,FALSE',
      ].join('\n'),
    )
    const mapping = guessMapping(rows[0]!)
    expect(mapping.handle).toBe(0)
    const [tshirt, casquette] = buildCandidates(rows, mapping)
    expect(tshirt).toMatchObject({ name: 'T-shirt Zuri', price: 5000, compareAtPrice: 7000, variantLabel: 'Taille', description: '<p>Coton bio</p>', isActive: true, lines: [2, 3, 4] })
    expect(tshirt!.images).toEqual(['https://s.test/t1.jpg', 'https://s.test/t2.jpg'])
    expect(tshirt!.variants).toEqual([
      { name: 'S', price: null, stock: 4, sku: 'TS-S' },
      { name: 'M', price: null, stock: 6, sku: 'TS-M' },
      { name: 'XL', price: 6000, stock: 0, sku: 'TS-XL' },
    ])
    // « Default Title » de Shopify = pas de variante.
    expect(casquette).toMatchObject({ name: 'Casquette', variants: [], variantLabel: null, isActive: false })
  })
})

describe('import CSV (API)', () => {
  const owner = new Client()
  const closer = new Client()
  let storeId = ''

  test('mise en place', async () => {
    await db.insert(users).values({ email: 'csv-owner@test.dev', name: 'CSV', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'csv-owner@test.dev', password: 'motdepasse-solide' })
    storeId = (await owner.post('/api/stores', { name: 'CSV Shop', slug: 'csv-shop', currency: 'XOF' })).body.id
    expect(storeId).toStartWith('shp_')
  })

  test('aperçu depuis un fichier envoyé', async () => {
    const csv = 'nom;prix;images;variante_nom;variante_valeurs\nSac;15 000;https://a.test/sac.jpg;Couleur;Noir|Rouge\nSans prix;;;;\n'
    const form = new FormData()
    form.set('file', new File([csv], 'produits.csv', { type: 'text/csv' }))
    const { app } = await import('../src/app')
    const res = await app.request(`/api/stores/${storeId}/products/import/csv/preview`, { method: 'POST', body: form, headers: { cookie: owner.cookie, 'cf-connecting-ip': '10.0.0.1' } })
    const body = (await res.json()) as { products: { name: string; errors: string[] }[]; format: string; needsMapping: boolean }
    expect(res.status).toBe(200)
    expect(body.format).toBe('zuri')
    expect(body.products.map((p) => p.name)).toEqual(['Sac', 'Sans prix'])
    expect(body.products[1]!.errors).toContain('Prix manquant ou illisible')
  })

  test('colonnes inconnues : l’API demande la correspondance', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products/import/csv/preview`, { text: 'Article,Tarif\nSac,1000\n' })
    expect(r.body.needsMapping).toBe(true)
    expect(r.body.headers).toEqual(['Article', 'Tarif'])
    const mapped = await owner.post(`/api/stores/${storeId}/products/import/csv/preview`, { text: 'Article,Tarif\nSac,1000\n', mapping: { name: 0, price: 1 } })
    expect(mapped.body.products[0]).toMatchObject({ name: 'Sac', price: 1000 })
  })

  test('import : produits inactifs, variantes, images rapatriées, image cassée = avertissement', async () => {
    const preview = await owner.post(`/api/stores/${storeId}/products/import/csv/preview`, {
      text: 'nom,prix,images,variante_nom,variante_valeurs,stock\nSac,15000,https://a.test/sac.jpg|https://a.test/cassee.jpg|https://a.test/sac2.jpg,Couleur,Noir|Rouge,\nEbook,9900,,,,\n',
    })
    const items = preview.body.products
    const r = await owner.post(`/api/stores/${storeId}/products/import/csv/commit`, { items, activate: false })
    expect(r.status).toBe(200)
    expect(r.body.results.every((x: { ok: boolean }) => x.ok)).toBe(true)
    const sacId = r.body.results[0].id
    expect(r.body.results[0].warnings).toContain('1 image(s) non récupérée(s)')
    const [sac] = await db.select().from(products).where(eq(products.id, sacId))
    expect(sac).toMatchObject({ name: 'Sac', isActive: false, price: 15000, coverImage: 'https://cdn.test/sac.jpg' })
    expect(sac!.content.gallery).toEqual(['https://cdn.test/sac2.jpg'])
    expect(sac!.payment.method).toBe('cod')
    const vars = await db.select().from(productVariants).where(eq(productVariants.productId, sacId))
    expect(vars.map((x) => x.name).sort()).toEqual(['Noir', 'Rouge'])
    expect(downloaded.at(-1)).toEqual(['https://a.test/sac.jpg', 'https://a.test/cassee.jpg', 'https://a.test/sac2.jpg'])
    const act = await owner.get(`/api/stores/${storeId}/activity`)
    expect(act.body.data.some((a: { message: string }) => a.message === '2 produit(s) importé(s) depuis un CSV')).toBe(true)
  })

  test('« Activer directement » et données invalides refusées produit par produit', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products/import/csv/commit`, {
      activate: true,
      items: [
        { index: 0, name: 'Actif', type: 'physical', price: 1000, compareAtPrice: null, description: '', images: [], variantLabel: null, variants: [], stock: null, sku: null, payment: null },
        { index: 1, name: 'X', type: 'physical', price: 1000, compareAtPrice: null, description: '', images: [], variantLabel: null, variants: [], stock: null, sku: null, payment: null },
      ],
    })
    expect(r.body.results[0]).toMatchObject({ ok: true })
    expect(r.body.results[1]).toMatchObject({ ok: false })
    const [p] = await db.select().from(products).where(eq(products.id, r.body.results[0].id))
    expect(p!.isActive).toBe(true)
  })

  test('un closer ne peut pas importer', async () => {
    await db.insert(users).values({ email: 'csv-closer@test.dev', name: 'Closer', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await closer.post('/api/auth/login', { email: 'csv-closer@test.dev', password: 'motdepasse-solide' })
    const inv = await owner.post(`/api/stores/${storeId}/team/invitations`, { email: 'csv-closer@test.dev', role: 'closer', productIds: null })
    const token = `jeton-csv-${crypto.randomUUID()}`
    await db.update(storeInvitations).set({ tokenHash: sha256(token) }).where(eq(storeInvitations.id, inv.body.invitation.id))
    expect((await closer.post('/api/invitations/accept', { token })).status).toBe(200)
    expect((await closer.post(`/api/stores/${storeId}/products/import/csv/preview`, { text: 'nom,prix\nA,1\n' })).status).toBe(403)
    expect((await closer.post(`/api/stores/${storeId}/products/import/csv/commit`, { items: [] })).status).toBe(403)
  })
})
