import { Router } from 'express'

import { isAuthorized } from '~/core/auth/authMiddleware'
import authRoutes from '~/modules/auth/auth.routes'
import noteRoutes from '~/modules/notes/note.routes'
import songRoutes from '~/modules/songs/song.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/songs', isAuthorized, songRoutes)
router.use('/notes', isAuthorized, noteRoutes)

export default router
