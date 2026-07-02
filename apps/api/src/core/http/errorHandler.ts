import { Prisma } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'

import { env } from '~/config/env'
import { ApiError } from '~/core/http/ApiError'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (env.NODE_ENV === 'development') {
    console.error('[Unhandled Error]', err)
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Resource already exists' })
    }
    if (err.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Resource not found' })
    }
    if (err.code === 'P2003') {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Related resource not found' })
    }
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
}
