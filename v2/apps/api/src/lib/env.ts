import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().url(),
  APP_KEY: z.string().refine((k) => Buffer.from(k, 'base64').length === 32, 'APP_KEY doit faire 32 octets en base64'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  STOREFRONT_URL: z.string().url().default('http://localhost:3000'),
  BASE_DOMAIN: z.string().default('zurisell.store'),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Zuri <noreply@example.com>'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  LEGACY_DATABASE_URL: z.string().optional(),
  /** Secret partagé avec le Worker Cloudflare : si défini, l'API refuse le trafic direct. */
  EDGE_SECRET: z.string().min(24).optional(),
  REGISTRATION_OPEN: z.enum(['true', 'false']).default('false'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Variables d’environnement invalides :', z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

/** Lu une seule fois au démarrage : jamais de lecture d'env dispersée dans le code. */
export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
