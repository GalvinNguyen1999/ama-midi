import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6).max(72),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
})

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1) }),
})

export const twoFactorTokenSchema = z.object({
  body: z.object({ token: z.string().length(6) }),
})

export const twoFactorVerifySchema = z.object({
  body: z.object({ userId: z.uuid(), token: z.string().length(6) }),
})
