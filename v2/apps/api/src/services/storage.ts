import { S3Client } from 'bun'
import { env } from '../lib/env'
import { HttpError } from '../lib/errors'

let client: S3Client | null = null
function s3(): S3Client {
  if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) throw new HttpError(503, 'Stockage S3 non configuré', 's3_unconfigured')
  client ??= new S3Client({
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  })
  return client
}

export const privateKey = (storeId: number, name: string) => `stores/${storeId}/private/${name}`

export async function putObject(key: string, body: Buffer | Blob, type: string, acl: 'public-read' | 'private') {
  await s3().write(key, body, { type, acl })
}

/** Les anciennes valeurs Laravel sont des clés relatives ("covers/…webp") ou déjà des URLs. */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (/^https?:\/\//.test(key)) return key
  const base = env.S3_PUBLIC_URL ?? (env.S3_ENDPOINT && env.S3_BUCKET ? `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_BUCKET}` : '')
  return `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`
}

export function signedUrl(key: string, expiresIn = 1800): string {
  return s3().presign(key, { expiresIn, method: 'GET' })
}
