import type { User } from '@prisma/client'
import { StatusCodes } from 'http-status-codes'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { AuthRepo } from './auth.repo'

import { env } from '~/config/env'
import { JwtProvider } from '~/core/auth/jwt'
import { ApiError } from '~/core/http/ApiError'
import { hashPassword, verifyPassword } from '~/utils/password'


const ACCESS_LIFE = '1h'
const REFRESH_LIFE = '14d'
const APP_NAME = 'AMA-MIDI'

authenticator.options = { window: 1 }

function issueTokens(user: Pick<User, 'id' | 'email'>) {
  const payload = { id: user.id, email: user.email }
  return {
    accessToken: JwtProvider.generate(payload, env.ACCESS_TOKEN_SECRET, ACCESS_LIFE),
    refreshToken: JwtProvider.generate(payload, env.REFRESH_TOKEN_SECRET, REFRESH_LIFE),
  }
}

export const AuthService = {
  async register(email: string, password: string) {
    const existing = await AuthRepo.findByEmail(email)
    if (existing) throw ApiError.Conflict('Email already registered')

    const passwordHash = await hashPassword(password)

    const user = await AuthRepo.create({ email, passwordHash })

    return { id: user.id, email: user.email, ...issueTokens(user) }
  },

  async login(email: string, password: string) {
    const user = await AuthRepo.findByEmail(email)

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid email or password')
    }

    if (user.twoFactorEnabled) {
      return { requires2FA: true as const, userId: user.id }
    }

    return { id: user.id, email: user.email, ...issueTokens(user) }
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = JwtProvider.verify(refreshToken, env.REFRESH_TOKEN_SECRET)

      const accessToken = JwtProvider.generate(
        { id: decoded.id, email: decoded.email },
        env.ACCESS_TOKEN_SECRET,
        ACCESS_LIFE,
      )

      return { accessToken }
    } catch {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid refresh token')
    }
  },

  async setupTwoFactor(userId: string) {
    const user = await AuthRepo.findById(userId)

    if (!user) throw ApiError.NotFound('User not found')

    const secret =
      user.twoFactorSecret && !user.twoFactorEnabled
        ? user.twoFactorSecret
        : authenticator.generateSecret()

    if (secret !== user.twoFactorSecret) {
      await AuthRepo.setTwoFactorSecret(userId, secret)
    }

    const otpauth = authenticator.keyuri(user.email, APP_NAME, secret)

    const qr = await QRCode.toDataURL(otpauth)

    return { otpauth, qr }
  },

  async enableTwoFactor(userId: string, token: string) {
    const user = await AuthRepo.findById(userId)
    if (!user?.twoFactorSecret) throw ApiError.BadRequest('2FA is not set up')

    if (!authenticator.verify({ token, secret: user.twoFactorSecret })) {
      throw ApiError.BadRequest('Invalid 2FA code')
    }

    await AuthRepo.enableTwoFactor(userId)

    return { enabled: true }
  },

  async verifyTwoFactor(userId: string, token: string) {
    const user = await AuthRepo.findById(userId)

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw ApiError.BadRequest('2FA is not enabled')
    }

    if (!authenticator.verify({ token, secret: user.twoFactorSecret })) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid 2FA code')
    }

    return { id: user.id, email: user.email, ...issueTokens(user) }
  },
}
