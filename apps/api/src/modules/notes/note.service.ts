import { Prisma } from '@prisma/client'

import { NoteRepo } from './note.repo'
import { NoteInput, NoteUpdateInput, toNoteDTO } from './note.types'

import { DEFAULT_NOTE_COLOR } from '~/config/constants'
import { ApiError } from '~/core/http/ApiError'
import { emit } from '~/core/realtime/emit'
import { SongService } from '~/modules/songs/song.service'


function translate(e: unknown): unknown {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return ApiError.Conflict('A note already exists at this track and time')
    if (e.code === 'P2025') return ApiError.NotFound('Note not found')
    if (e.code === 'P2003') return ApiError.NotFound('Song not found')
  }
  return e
}

export const NoteService = {
  async seed(songId: string, count: number, userId?: string) {
    try {
      await SongService.assertCanEdit(songId, userId)
      const inserted = await NoteRepo.bulkSeed(songId, count)
      return { inserted }
    } catch (e) {
      throw translate(e)
    }
  },

  async importNotes(songId: string, notes: { track: number; time: number }[], userId?: string) {
    try {
      await SongService.assertCanEdit(songId, userId)
      const inserted = await NoteRepo.bulkImport(songId, notes)
      return { inserted }
    } catch (e) {
      throw translate(e)
    }
  },

  async create(songId: string, input: NoteInput, actor?: string, userId?: string) {
    try {
      await SongService.assertCanEdit(songId, userId)

      const { note, version } = await NoteRepo.create(
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

      const dto = toNoteDTO(note)

      emit.noteCreated(songId, dto, version, actor)

      return dto
    } catch (e) {
      throw translate(e)
    }
  },

  async update(id: string, input: NoteUpdateInput, actor?: string, userId?: string) {
    try {
      const found = await NoteRepo.findSongId(id)
      if (!found) throw ApiError.NotFound('Note not found')
      await SongService.assertCanEdit(found.songId, userId)

      const { note, version } = await NoteRepo.update(id, input, actor)

      const dto = toNoteDTO(note)

      emit.noteUpdated(note.songId, dto, version, actor)

      return dto
    } catch (e) {
      throw translate(e)
    }
  },

  async remove(id: string, actor?: string, userId?: string) {
    try {
      const found = await NoteRepo.findSongId(id)
      if (!found) throw ApiError.NotFound('Note not found')
      await SongService.assertCanEdit(found.songId, userId)

      const { note, version } = await NoteRepo.remove(id, actor)

      emit.noteDeleted(note.songId, note.id, version, actor)
    } catch (e) {
      throw translate(e)
    }
  },
}
