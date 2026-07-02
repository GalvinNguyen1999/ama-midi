import { Prisma } from '@prisma/client'

import { NoteRepo } from './note.repo'
import { NoteInput, NoteUpdateInput, toNoteDTO } from './note.types'

import { DEFAULT_NOTE_COLOR } from '~/config/constants'
import { ApiError } from '~/core/http/ApiError'


function translate(e: unknown): unknown {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return ApiError.Conflict('A note already exists at this track and time')
    if (e.code === 'P2025') return ApiError.NotFound('Note not found')
    if (e.code === 'P2003') return ApiError.NotFound('Song not found')
  }
  return e
}

export const NoteService = {
  async create(songId: string, input: NoteInput, actor?: string) {
    try {
      const note = await NoteRepo.create(
        songId,
        {
          title: input.title,
          description: input.description,
          track: input.track,
          time: input.time,
          color: input.color ?? DEFAULT_NOTE_COLOR,
        },
        actor,
      )
      return toNoteDTO(note)
    } catch (e) {
      throw translate(e)
    }
  },

  async update(id: string, input: NoteUpdateInput, actor?: string) {
    try {
      const note = await NoteRepo.update(id, input, actor)
      return toNoteDTO(note)
    } catch (e) {
      throw translate(e)
    }
  },

  async remove(id: string, actor?: string) {
    try {
      await NoteRepo.remove(id, actor)
    } catch (e) {
      throw translate(e)
    }
  },
}
