import { app } from './app'
import { env } from './lib/env'

const server = Bun.serve({ port: env.PORT, fetch: app.fetch, maxRequestBodySize: 520 * 1024 * 1024 })
console.log(`🚀 API Zuri sur http://localhost:${server.port}`)
