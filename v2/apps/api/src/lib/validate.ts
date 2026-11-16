import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'
import { HttpError } from './errors'

class ValidationError extends HttpError {
  constructor(public issues: unknown) {
    super(422, 'Données invalides', 'validation')
  }
}
export { ValidationError }

/** zValidator avec une réponse d'erreur uniforme { error, code, issues }. */
export const v = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (result) => {
    if (!result.success) throw new ValidationError(result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
  })
