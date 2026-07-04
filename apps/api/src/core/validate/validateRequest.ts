import { Request, Response, NextFunction } from 'express'
import { z, ZodObject } from 'zod'

import { ApiError } from '~/core/http/ApiError'

export const ZodEmptyObject = z.object({}).optional()

export function validateRequest(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })

    if (!result.success) {
      const details = result.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }))

      throw ApiError.BadRequest(
        `Validation error: ${details.map(i => i.path).join(', ')}`,
        details
      )
    }

    next()
  }
}
