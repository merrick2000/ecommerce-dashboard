/**
 * Messages de la popup de ventes rédigés par l'IA à partir des consignes du vendeur :
 * prénoms et villes cohérents avec le pays de la boutique, produits choisis.
 */
import { z } from 'zod'
import { env } from '../lib/env'
import { HttpError } from '../lib/errors'

export const popupEntriesSchema = z.object({
  entries: z
    .array(z.object({ firstName: z.string().trim().min(1).max(40), city: z.string().trim().max(60).optional(), product: z.string().trim().min(1).max(120), text: z.string().trim().max(160).optional() }))
    .min(1)
    .max(30),
})

const TOOL = {
  name: 'messages',
  description: 'Messages de la popup de ventes',
  input_schema: {
    type: 'object',
    properties: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'Prénom seul, courant dans le pays' },
            city: { type: 'string', description: 'Ville ou quartier du pays' },
            product: { type: 'string', description: 'Nom exact du produit, choisi dans la liste' },
            text: { type: 'string', description: 'Texte libre facultatif (max 160 caractères), seulement si les consignes le demandent' },
          },
          required: ['firstName', 'product'],
        },
      },
    },
    required: ['entries'],
  },
}

export async function generatePopupEntries(input: { count: number; country: string; locale: string; products: string[]; cities: string[]; instructions?: string }) {
  if (!env.KIE_API_KEY) throw new HttpError(404, 'IA non configurée', 'ai_unavailable')
  const prompt = `Tu prépares les messages d'une popup de ventes récentes pour une boutique en ligne (pays : ${input.country}, langue : ${input.locale === 'en' ? 'anglais' : 'français'}).
Écris exactement ${input.count} messages variés : prénoms courants et réalistes dans ce pays (mélange femmes et hommes, sans doublon), villes ou quartiers de ce pays.
Produits possibles (nom exact à reprendre tel quel) :
${input.products.map((p) => `- ${p}`).join('\n')}
${input.cities.length ? `Villes livrées par la boutique (à privilégier) : ${input.cities.join(', ')}.` : ''}
Pas de texte libre sauf si les consignes le demandent. Aucun emoji, aucun tiret long.
${input.instructions ? `Consignes du vendeur :\n${input.instructions}` : ''}`
  let res: Response
  try {
    res = await fetch('https://api.kie.ai/claude/v1/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.KIE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.KIE_MODEL || 'claude-sonnet-5', stream: false, max_tokens: 3000, messages: [{ role: 'user', content: prompt }], tools: [TOOL], tool_choice: { type: 'tool', name: 'messages' } }),
      signal: AbortSignal.timeout(45_000),
    })
  } catch {
    throw new HttpError(504, 'L’IA met trop de temps à répondre. Réessayez.', 'ai_error')
  }
  const body = (await res.json().catch(() => null)) as { code?: number; msg?: string; content?: { type: string; name?: string; input?: unknown }[] } | null
  if (!res.ok || !body || (body.code != null && body.code !== 200)) throw new HttpError(424, body?.msg ? `IA indisponible : ${body.msg}` : 'IA indisponible pour le moment.', 'ai_error')
  const parsed = popupEntriesSchema.safeParse(body.content?.find((b) => b.type === 'tool_use')?.input)
  if (!parsed.success) throw new HttpError(424, 'Les messages reçus sont incomplets. Réessayez.', 'ai_error')
  // Pas d'emoji ni de tiret long dans le texte final.
  const clean = (s?: string) => s?.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s*[—–]\s*/g, ', ').trim() || undefined
  return parsed.data.entries.slice(0, input.count).map((e) => ({ firstName: clean(e.firstName)!, city: clean(e.city), product: e.product, text: clean(e.text) }))
}
