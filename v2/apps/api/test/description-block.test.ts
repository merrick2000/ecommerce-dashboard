import { describe, expect, test } from 'bun:test'
import { extractProduct, fullDescriptionBlock } from '../src/services/url-import'

/** Sites qui ne donnent qu'un résumé tronqué dans leurs données produit (ex. Chariow) : bloc complet repris dans la page. */
const long = Array.from({ length: 12 }, (_, i) => `<p>Module ${i + 1} : une leçon complète et concrète pour avancer pas à pas sans matériel coûteux.</p>`).join('')
const page = (body: string) => `<html><head><script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: 'Formation Whiteboard',
  image: 'https://cdn.example.com/cover.jpg',
  description: '&#039;&#039;Marre de vouloir gagner de l’argent en ligne sans te montrer ?&#039;&#039; Avec ...',
  offers: { '@type': 'Offer', priceCurrency: 'XOF', price: '10 484 F CFA' },
})}</script></head><body><header><nav>Produits Affiliation Contact</nav></header>${body}<footer>Mentions légales. Powered by Chariow</footer></body></html>`

describe('description tronquée', () => {
  test('bloc complet retrouvé, sans le reste de la page', async () => {
    const html = page(`<main><div class="price">10 484 F CFA</div><div data-c="ProductDescription"><blockquote><span>&#039;&#039;Marre de vouloir gagner de l’argent en ligne sans te montrer ?&#039;&#039;</span></blockquote><p>Avec le programme complet tu apprends tout.</p>${long}</div><div class="reviews">Olivier E. il y a 4 mois : super</div></main>`)
    const r = await extractProduct(html, 'https://boutique.example.com/academy')
    expect(r.draft.price).toBe(10484)
    expect(r.draft.currency).toBe('XOF')
    expect(r.draft.description).toContain('Avec le programme complet')
    expect(r.draft.description).toContain('Module 12')
    expect(r.draft.description).not.toContain('il y a 4 mois')
    expect(r.draft.description).not.toContain('Powered by')
    expect(r.detected).toContain('page')
  })

  test('aucun bloc sûr : le résumé est gardé', () => {
    // Le texte n'est pas au début d'un bloc : on ne prend pas toute la page.
    const html = `<div><p>Bienvenue sur la boutique, des centaines de produits.</p><p>Plus bas : Marre de vouloir gagner de l’argent en ligne.</p>${long}</div>`
    expect(fullDescriptionBlock(html, 'Marre de vouloir gagner de l’argent en ligne…')).toBeNull()
    expect(fullDescriptionBlock('<div>rien à voir</div>', 'Marre de vouloir gagner de l’argent…')).toBeNull()
  })
})
