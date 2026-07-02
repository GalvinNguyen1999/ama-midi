import { Router } from 'express'

import noteRoutes from '~/modules/notes/note.routes'
import songRoutes from '~/modules/songs/song.routes'

const router = Router()

router.use('/songs', songRoutes)
router.use('/notes', noteRoutes)

export default router
