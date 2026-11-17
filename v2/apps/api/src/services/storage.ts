import { S3Client } from 'bun'
import { env } from '../lib/env'
import { HttpError } from '../lib/errors'

/**
 * Deux buckets, parce que R2 n'a pas de permissions par fichier :
 * - S3_BUCKET          : public (images des pages de vente), servi via S3_PUBLIC_URL ;
 * - S3_PRIVATE_BUCKET  : jamais public (fichiers digitaux vendus), lus par URL signée après paiement.
 * Sans S3_PRIVATE_BUCKET (dev, S3 classique avec ACL), le bucket public sert pour les deux.
 */
const clients = new Map<string, S3Client>()
function s3(bucket: string | undefined): S3Client {
  if (!bucket || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) throw new HttpError(503, 'Stockage de fichiers non configuré', 's3_unconfigured')
  let c = clients.get(bucket)
  if (!c) {
    c = new S3Client({ bucket, endpoint: env.S3_ENDPOINT, region: env.S3_REGION, accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY })
    clients.set(bucket, c)
  }
  return c
}
const publicBucket = () => env.S3_BUCKET
const privateBucket = () => env.S3_PRIVATE_BUCKET ?? env.S3_BUCKET

export const privateKey = (storeId: number, name: string) => `stores/${storeId}/private/${name}`

export async function putObject(key: string, body: Buffer | Blob, type: string, visibility: 'public-read' | 'private') {
  if (visibility === 'public-read') {
    await s3(publicBucket()).write(key, body, { type, acl: 'public-read' })
  } else {
    await s3(privateBucket()).write(key, body, { type, acl: 'private' })
  }
}

/** Les anciennes valeurs Laravel sont des clés relatives ("covers/…webp") ou déjà des URLs. */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (/^https?:\/\//.test(key)) return key
  const base = env.S3_PUBLIC_URL ?? (env.S3_ENDPOINT && env.S3_BUCKET ? `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_BUCKET}` : '')
  return `${base.replace(/\/$/, '')}/${key.replace(/^\//, '')}`
}

/** Lien de téléchargement temporaire pour un fichier digital acheté. */
export function signedUrl(key: string, expiresIn = 1800): string {
  return s3(privateBucket()).presign(key, { expiresIn, method: 'GET' })
}
