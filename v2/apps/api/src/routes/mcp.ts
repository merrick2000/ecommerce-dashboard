/**
 * Serveur MCP (Model Context Protocol) de Zuri, transport « Streamable HTTP » sans état :
 * POST /api/mcp avec `Authorization: Bearer zk_live_…`. Réponses JSON (pas de flux SSE).
 * Fonctionne avec Claude (claude.ai, Desktop, Code), Cursor, ChatGPT et tout client MCP.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { env } from '../lib/env'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { SERVER_INSTRUCTIONS, ToolError, TOOLS, type Tool, type ToolContext } from '../services/mcp/tools'

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const SERVER_INFO = { name: 'zuri', title: 'Zuri', version: '1.0.0' }

type JsonRpcRequest = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: any }

const rpcError = (id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } })
const rpcResult = (id: JsonRpcRequest['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result })

/** Schémas JSON des outils, calculés une fois (côté « entrée » : les champs à défaut restent optionnels). */
const toolDefs = TOOLS.map((t) => {
  const { $schema: _s, ...inputSchema } = z.toJSONSchema(t.input, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>
  return {
    tool: t,
    def: {
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema,
      annotations: { title: t.title, readOnlyHint: Boolean(t.readOnly), destructiveHint: Boolean(t.destructive), idempotentHint: Boolean(t.readOnly), openWorldHint: false },
    },
  }
})
const byName = new Map(toolDefs.map((d) => [d.tool.name, d.tool]))

/** Appels internes à l'API REST, avec la même clé : mêmes routes, mêmes droits, même journal. */
function makeContext(authorization: string, ip: string | undefined, keyStoreId: string | null): ToolContext {
  return {
    keyStoreId,
    async call(method, path, opts = {}) {
      const { app } = await import('../app')
      const qs = new URLSearchParams()
      for (const [k, val] of Object.entries(opts.query ?? {})) if (val !== undefined && val !== null && val !== '') qs.set(k, String(val))
      const headers: Record<string, string> = { authorization, accept: 'application/json' }
      if (env.EDGE_SECRET) headers['x-edge-secret'] = env.EDGE_SECRET
      if (ip) headers['cf-connecting-ip'] = ip
      if (opts.body !== undefined) headers['content-type'] = 'application/json'
      const res = await app.request(`/api${path}${qs.size ? `?${qs}` : ''}`, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) })
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = text
      }
      if (!res.ok) {
        const issues = Array.isArray(json?.issues) ? ` (${json.issues.slice(0, 5).map((i: any) => `${(i.path ?? []).join?.('.') ?? i.path}: ${i.message}`).join('; ')})` : ''
        throw new ToolError(`${json?.error ?? `HTTP ${res.status}`}${issues}`)
      }
      return json
    },
  }
}

async function runTool(tool: Tool, rawArgs: unknown, ctx: ToolContext) {
  const parsed = tool.input.safeParse(rawArgs ?? {})
  if (!parsed.success) {
    const msg = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ')
    return { content: [{ type: 'text', text: `Invalid arguments: ${msg}` }], isError: true }
  }
  try {
    const out = await tool.run(parsed.data, ctx)
    const text = JSON.stringify(out ?? { ok: true }, null, 1)
    return {
      content: [{ type: 'text', text: text.length > 200_000 ? `${text.slice(0, 200_000)}\n…(truncated: narrow the request with filters or pagination)` : text }],
      ...(out && typeof out === 'object' && !Array.isArray(out) && text.length <= 200_000 ? { structuredContent: out } : {}),
    }
  } catch (err) {
    const msg = err instanceof ToolError || err instanceof HttpError ? err.message : 'Internal error'
    if (!(err instanceof ToolError || err instanceof HttpError)) console.error(`[mcp] ${tool.name}`, err)
    return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }
  }
}

export const mcpRoutes = new Hono<AppEnv>()
  // Pas de flux serveur → client : le client se contente des réponses JSON.
  .get('/', (c) => c.json(rpcError(null, -32000, 'Use POST (stateless Streamable HTTP, JSON responses)'), 405, { Allow: 'POST' }))
  .delete('/', (c) => c.body(null, 405, { Allow: 'POST' }))
  .post(
    '/',
    async (c, next) => {
      // Sans clé : 401 + indication du schéma attendu (les clients MCP l'affichent).
      if (!/^Bearer\s+zk_/i.test(c.req.header('authorization') ?? '')) {
        return c.json(rpcError(null, -32001, 'Missing API key: create one in Zuri > Paramètres > API et IA, then send Authorization: Bearer zk_live_…'), 401, { 'WWW-Authenticate': 'Bearer realm="zuri"' })
      }
      await next()
    },
    requireAuth,
    rateLimit({ key: 'mcp', limit: 600, windowSec: 600 }),
    async (c) => {
      const key = c.get('apiKey')!
      let payload: unknown
      try {
        payload = await c.req.json()
      } catch {
        return c.json(rpcError(null, -32700, 'Parse error'), 400)
      }
      const ctx = makeContext(c.req.header('authorization')!, c.req.header('cf-connecting-ip') ?? undefined, key.storeId)
      const visible = toolDefs.filter((d) => key.scope === 'write' || d.tool.readOnly)

      const handle = async (msg: JsonRpcRequest): Promise<object | null> => {
        if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid request')
        const isNotification = msg.id === undefined || msg.id === null
        switch (msg.method) {
          case 'initialize': {
            const asked = msg.params?.protocolVersion
            return rpcResult(msg.id, {
              protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
              capabilities: { tools: { listChanged: false } },
              serverInfo: SERVER_INFO,
              instructions: SERVER_INSTRUCTIONS,
            })
          }
          case 'ping':
            return rpcResult(msg.id, {})
          case 'tools/list':
            return rpcResult(msg.id, { tools: visible.map((d) => d.def) })
          case 'tools/call': {
            const name = msg.params?.name
            const tool = byName.get(name)
            if (!tool || !visible.some((d) => d.tool === tool)) return rpcError(msg.id, -32602, `Unknown tool: ${name}`)
            console.log(`[mcp] ${name} user=${c.get('user').id} key=${key.id}`)
            return rpcResult(msg.id, await runTool(tool, msg.params?.arguments, ctx))
          }
          case 'resources/list':
            return rpcResult(msg.id, { resources: [] })
          case 'resources/templates/list':
            return rpcResult(msg.id, { resourceTemplates: [] })
          case 'prompts/list':
            return rpcResult(msg.id, { prompts: [] })
          default:
            if (isNotification || msg.method.startsWith('notifications/')) return null
            return rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
        }
      }

      if (Array.isArray(payload)) {
        const out = (await Promise.all(payload.map((m) => handle(m as JsonRpcRequest)))).filter(Boolean)
        return out.length ? c.json(out) : c.body(null, 202)
      }
      const out = await handle(payload as JsonRpcRequest)
      return out ? c.json(out) : c.body(null, 202)
    },
  )
