import type { ZodType } from 'zod'
import { ApiError } from './api'

export type Errors = Record<string, string>

/** Valide côté client avec le schéma partagé ; renvoie { data } ou { errors } (clés « a.b.0 »). */
export function validate<T>(schema: ZodType<T>, input: unknown): { data: T; errors: null } | { data: null; errors: Errors } {
  const r = schema.safeParse(input)
  if (r.success) return { data: r.data, errors: null }
  const errors: Errors = {}
  for (const i of r.error.issues) {
    const k = i.path.map(String).join('.')
    if (!(k in errors)) errors[k] = i.message
  }
  return { data: null, errors }
}

/** Erreurs serveur 422 → champs ; sinon null (à afficher en toast). */
export function serverErrors(e: unknown): Errors | null {
  if (e instanceof ApiError && e.status === 422 && e.issues.length) return e.fieldErrors
  return null
}

/** Nombre vide → null, sinon nombre. */
export const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v.replace(/\s/g, '').replace(',', '.')))
export const strOrNull = (v: string | null | undefined): string | null => (v && v.trim() !== '' ? v.trim() : null)
