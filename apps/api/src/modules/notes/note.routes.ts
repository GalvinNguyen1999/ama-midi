import { Router } from 'express'


import { NoteController } from './note.controller'
import { noteIdParamSchema, updateNoteSchema } from './note.validation'

import { validateRequest } from '~/core/validate/validateRequest'

const router = Router()

router.patch('/:id', validateRequest(updateNoteSchema), NoteController.update)
router.delete('/:id', validateRequest(noteIdParamSchema), NoteController.remove)

export default router
