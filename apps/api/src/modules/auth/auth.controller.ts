import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { AuthService } from './auth.service'

import { env } from '~/config/env'
import { asyncHandler } from '~/core/asyncHandler'


const COOKIE_MAX_AGE = 14 * 24 * 60 * 60 * 1000

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: COOKIE_MAX_AGE,
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, cookieOptions())
  res.cookie('refreshToken', refreshToken, cookieOptions())
}

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body.email, req.body.password)

    setAuthCookies(res, result.accessToken, result.refreshToken)

    res.status(StatusCodes.CREATED).json(result)
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body.email, req.body.password)

    if ('accessToken' in result) {
      setAuthCookies(res, result.accessToken, result.refreshToken)
    }

    res.json(result)
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken } = await AuthService.refresh(req.body.refreshToken)

    res.cookie('accessToken', accessToken, cookieOptions())

    res.json({ accessToken })
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out' })
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({ id: req.user?.id, email: req.user?.email })
  }),

  setup2fa: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
      return
    }

    res.json(await AuthService.setupTwoFactor(userId))
  }),

  enable2fa: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
      return
    }

    res.json(await AuthService.enableTwoFactor(userId, req.body.token))
  }),

  verify2fa: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.verifyTwoFactor(req.body.userId, req.body.token)

    setAuthCookies(res, result.accessToken, result.refreshToken)

    res.json(result)
  }),
}
