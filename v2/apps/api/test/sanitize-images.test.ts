import { describe, expect, test } from 'bun:test'
import { sanitizeHtml } from '../src/lib/sanitize'

/** Images de description réduites et alignées depuis l'éditeur : seules les largeurs prévues passent. */
describe('taille des images de description', () => {
  test('largeur et alignement gardés, le reste retiré', () => {
    const out = sanitizeHtml('<p><img src="https://x.test/a.jpg" style="width:50%" data-align="left"></p><p><img src="https://x.test/b.jpg" style="width:30%;position:fixed"></p>')
    expect(out).toContain('style="width:50%"')
    expect(out).toContain('data-align="left"')
    expect(out).not.toContain('30%')
    expect(out).not.toContain('position')
  })

  test('emplacement d’un bouton glissé dans le texte gardé', () => {
    const out = sanitizeHtml('<p>Un</p><div data-cta-slot="8xtl7qvc"></div><p>Deux</p>')
    expect(out).toContain('data-cta-slot="8xtl7qvc"')
  })
})
