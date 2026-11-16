import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class HttpError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

export const notFound = (what = 'Ressource') => new HttpError(404, `${what} introuvable`, 'not_found')
export const forbidden = (msg = 'Accès refusé') => new HttpError(403, msg, 'forbidden')
export const badRequest = (msg: string, code = 'bad_request') => new HttpError(400, msg, code)
export const conflict = (msg: string, code = 'conflict') => new HttpError(409, msg, code)
