import { describe, expect, test } from 'bun:test'
import { buildFrom } from '../src/services/notify'

describe('buildFrom', () => {
  test('remplace le nom en gardant l’adresse', () => {
    expect(buildFrom('Zuri <commandes@zurisell.store>', 'Ma Boutique')).toBe('"Ma Boutique" <commandes@zurisell.store>')
  })
  test('sans nom : MAIL_FROM tel quel', () => {
    expect(buildFrom('Zuri <commandes@zurisell.store>', null)).toBe('Zuri <commandes@zurisell.store>')
  })
  test('nettoie les caractères dangereux', () => {
    expect(buildFrom('commandes@zurisell.store', 'A"<b>\r\nBcc: x')).toBe('"AbBcc: x" <commandes@zurisell.store>')
  })
})
