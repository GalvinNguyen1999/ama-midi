import jwt, { type SignOptions } from 'jsonwebtoken'

export interface JwtUser {
  id: string
  email: string
}

export interface JwtDecoded extends JwtUser {
  iat: number
  exp: number
}

export const JwtProvider = {
  generate(payload: JwtUser, secret: string, expiresIn: SignOptions['expiresIn']): string {
    return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn })
  },

  verify(token: string, secret: string): JwtDecoded {
    return jwt.verify(token, secret) as JwtDecoded
  },
}
