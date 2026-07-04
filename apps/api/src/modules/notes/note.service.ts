import { Prisma } from '@prisma/client'

import { NoteRepo } from './note.repo'
import { NoteInput, NoteUpdateInput, toNoteDTO } from './note.types'

import { DEFAULT_NOTE_COLOR } from '~/config/constants'
import { ApiError } from '~/core/http/ApiError'
import { hub } from '~/core/realtime/hub'
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

      hub.broadcast(songId, { type: 'note.created', songId, note: dto, version, actor })

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

      hub.broadcast(note.songId, {
        type: 'note.updated',
        songId: note.songId,
        note: dto,
        version,
        actor,
      })

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

      hub.broadcast(note.songId, {
        type: 'note.deleted',
        songId: note.songId,
        noteId: note.id,
        version,
        actor,
      })

    } catch (e) {
      throw translate(e)
    }
  },
}
