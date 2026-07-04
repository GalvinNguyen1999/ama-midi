import express, { Router } from 'express'

import { SongController } from './song.controller'
import {
  createSongSchema,
  inviteSchema,
  removeCollaboratorSchema,
  renameSongSchema,
  respondInviteSchema,
  setShareSchema,
  songIdParamSchema,
  updateBpmSchema,
} from './song.validation'

import { validateRequest } from '~/core/validate/validateRequest'
import { NoteController } from '~/modules/notes/note.controller'
import { createNoteSchema, importNotesSchema } from '~/modules/notes/note.validation'


const router = Router()

router.post('/', validateRequest(createSongSchema), SongController.create)
router.get('/', SongController.list)
router.get('/invitations', SongController.myInvites)

router.get('/:id', validateRequest(songIdParamSchema), SongController.getById)
router.get('/:id/events', validateRequest(songIdParamSchema), SongController.getEvents)
router.get('/:id/suggest', validateRequest(songIdParamSchema), SongController.suggest)
router.patch('/:id', validateRequest(renameSongSchema), SongController.rename)
router.patch('/:id/bpm', validateRequest(updateBpmSchema), SongController.updateBpm)
router.patch('/:id/share', validateRequest(setShareSchema), SongController.setShare)
router.delete('/:id', validateRequest(songIdParamSchema), SongController.remove)

router.post(
  '/:id/invitations/respond',
  validateRequest(respondInviteSchema),
  SongController.respondInvite,
)
router.post('/:id/collaborators', validateRequest(inviteSchema), SongController.invite)
router.delete(
  '/:id/collaborators/:userId',
  validateRequest(removeCollaboratorSchema),
  SongController.removeCollaborator,
)

router.get('/:songId/notes', SongController.getNotes)
router.post('/:songId/notes', validateRequest(createNoteSchema), NoteController.create)
router.post('/:songId/notes/seed', NoteController.seed)
router.post(
  '/:songId/notes/import',
  express.raw({ type: () => true, limit: '1mb' }),
  validateRequest(importNotesSchema),
  NoteController.import,
)

export default router
