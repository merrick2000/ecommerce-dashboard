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
  S3_PRIVATE_BUCKET: z.string().optional(),
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
  /** Connexion Google (Google Cloud Console → Identifiants → ID client OAuth « Application Web »). */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Suggestions IA de l'import de produits (kie.ai, API compatible Messages). Absente : fonction masquée. */
  KIE_API_KEY: z.string().optional(),
  KIE_MODEL: z.string().optional(),
  /** Modèle d'édition d'image kie.ai (régénération des images de description). */
  KIE_IMAGE_MODEL: z.string().optional(),
  /** « true » : panier ouvert à tous les vendeurs (sinon réglage du super admin ou option du compte). */
  CART_ENABLED: z.string().optional(),
  /** Secret des webhooks GentleMail (boîte contact@) : sans lui, la réception des emails est désactivée. */
  GENTLEMAIL_WEBHOOK_SECRET: z.string().optional(),
  /** Adresse de l'interface GentleMail (lien « Ouvrir dans la boîte » du super admin). */
  GENTLEMAIL_URL: z.string().url().optional(),
  /** Firecrawl (rendu JavaScript + proxys anti-blocage) : secours de l'import de produit par lien. */
  FIRECRAWL_API_KEY: z.string().optional(),
  /** Payment Orchestrator (payment.zurisell.store) : compte de la plateforme (boutiques du super admin, webhook global). */
  PO_BASE_URL: z.string().url().default('https://payment.zurisell.store'),
  PO_SECRET_KEY: z.string().optional(),
  PO_WEBHOOK_SECRET: z.string().optional(),
  /** Inscriptions ouvertes à tous (par défaut). « false » : seul le premier compte peut s'inscrire (outil perso). */
  REGISTRATION_OPEN: z.enum(['true', 'false']).default('true'),
})

// Variable vide (ex. « KIE_MODEL: ${KIE_MODEL:-} » dans docker-compose quand elle n'est pas définie) = absente :
// sinon une valeur vide remplace la valeur par défaut (le modèle d'IA partait vide).
const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ''))
const parsed = schema.safeParse(cleaned)
if (!parsed.success) {
  console.error('❌ Variables d’environnement invalides :', z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

/** Lu une seule fois au démarrage : jamais de lecture d'env dispersée dans le code. */
export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
