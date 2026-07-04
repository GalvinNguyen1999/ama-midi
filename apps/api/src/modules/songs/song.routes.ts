import { Router } from 'express'

import { SongController } from './song.controller'
import { createSongSchema, setShareSchema, songIdParamSchema } from './song.validation'

import { validateRequest } from '~/core/validate/validateRequest'
import { NoteController } from '~/modules/notes/note.controller'
import { createNoteSchema } from '~/modules/notes/note.validation'


const router = Router()

router.post('/', validateRequest(createSongSchema), SongController.create)
router.get('/', SongController.list)

router.get('/:id', validateRequest(songIdParamSchema), SongController.getById)
router.get('/:id/events', validateRequest(songIdParamSchema), SongController.getEvents)
router.patch('/:id/share', validateRequest(setShareSchema), SongController.setShare)
router.delete('/:id', validateRequest(songIdParamSchema), SongController.remove)

router.get('/:songId/notes', SongController.getNotes)
router.post('/:songId/notes', validateRequest(createNoteSchema), NoteController.create)
router.post('/:songId/notes/seed', NoteController.seed)

export default router
