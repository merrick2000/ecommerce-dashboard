import { describe, expect, test } from 'bun:test'
import { assertPublicUrl } from '../src/services/remote'

describe('téléchargement sûr (SSRF)', () => {
  for (const bad of [
    'http://localhost/admin',
    'http://127.0.0.1:8787/api/health',
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://172.16.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://0.0.0.0/',
    'file:///etc/passwd',
    'ftp://exemple.com/x',
    'http://user:pass@exemple.com/',
    'http://service.internal/',
  ]) {
    test(`refusé : ${bad}`, async () => {
      await expect(assertPublicUrl(bad)).rejects.toThrow()
    })
  }
  test('adresse IP publique acceptée', async () => {
    expect((await assertPublicUrl('https://1.1.1.1/')).hostname).toBe('1.1.1.1')
  })
})
