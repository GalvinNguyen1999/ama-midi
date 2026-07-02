import { Router } from 'express'

import { SongController } from './song.controller'
import { createSongSchema, songIdParamSchema } from './song.validation'

import { validateRequest } from '~/core/validate/validateRequest'
import { NoteController } from '~/modules/notes/note.controller'
import { createNoteSchema } from '~/modules/notes/note.validation'


const router = Router()

router.post('/', validateRequest(createSongSchema), SongController.create)
router.get('/', SongController.list)
router.get('/:id', validateRequest(songIdParamSchema), SongController.getById)
router.get('/:id/events', validateRequest(songIdParamSchema), SongController.getEvents)
router.post('/:songId/notes', validateRequest(createNoteSchema), NoteController.create)

export default router
