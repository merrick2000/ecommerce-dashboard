import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from './env'

const key = Buffer.from(env.APP_KEY, 'base64')

/** AES-256-GCM. Format : base64(iv[12] | tag[16] | ciphertext). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}

export const encryptJson = (v: unknown) => encrypt(JSON.stringify(v))
export const decryptJson = <T>(v: string | null | undefined, fallback: T): T => (v ? (JSON.parse(decrypt(v)) as T) : fallback)

export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Numéro de commande lisible, sans caractères ambigus (0/O, 1/I). */
export function orderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `SLT-${out}`
}
