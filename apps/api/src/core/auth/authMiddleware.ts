import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { JwtProvider } from './jwt'

import { env } from '~/config/env'


export function isAuthorized(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token =
    header && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : req.cookies?.accessToken

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
    return
  }

  try {
    req.user = JwtProvider.verify(token, env.ACCESS_TOKEN_SECRET)
    next()
  } catch (e) {
    if (e instanceof Error && e.name === 'TokenExpiredError') {
      res.status(StatusCodes.GONE).json({ message: 'Token expired' })
      return
    }
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
  }
}
