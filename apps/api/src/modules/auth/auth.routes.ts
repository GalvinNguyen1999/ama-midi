import { Router } from 'express'

import { AuthController } from './auth.controller'
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  twoFactorTokenSchema,
  twoFactorVerifySchema,
} from './auth.validation'

import { isAuthorized } from '~/core/auth/authMiddleware'
import { authLimiter } from '~/core/http/rateLimit'
import { validateRequest } from '~/core/validate/validateRequest'


const router = Router()

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register)
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login)
router.put('/refresh_token', validateRequest(refreshSchema), AuthController.refresh)
router.delete('/logout', AuthController.logout)
router.get('/me', isAuthorized, AuthController.me)
router.post('/2fa/setup', isAuthorized, AuthController.setup2fa)
router.post('/2fa/enable', isAuthorized, validateRequest(twoFactorTokenSchema), AuthController.enable2fa)
router.post('/2fa/verify', authLimiter, validateRequest(twoFactorVerifySchema), AuthController.verify2fa)

export default router
