import { app } from './app'
import { env } from './lib/env'

// idleTimeout : Bun coupe à 10 s par défaut ; les imports IA et les outils MCP peuvent durer plus (max 255 s).
const server = Bun.serve({ port: env.PORT, fetch: app.fetch, maxRequestBodySize: 520 * 1024 * 1024, idleTimeout: 240 })
console.log(`🚀 API Zuri sur http://localhost:${server.port}`)

// Bot Telegram (si configuré) : déclare le webhook, sans bloquer le démarrage.
if (env.NODE_ENV !== 'test') void import('./services/notifications').then((m) => m.ensureTelegramWebhook())
