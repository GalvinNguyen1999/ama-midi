import { Prisma } from '@prisma/client'

import { SongRepo } from './song.repo'
import { toNoteEventDTO, toSongDTO, toSongWithNotesDTO } from './song.types'

import { ApiError } from '~/core/http/ApiError'
import { toNoteDTO } from '~/modules/notes/note.types'

export const SongService = {
  async create(input: { title: string; bpm?: number }, ownerId?: string) {
    const song = await SongRepo.create({ ...input, ownerId })
    return toSongDTO(song)
  },

  async list() {
    const songs = await SongRepo.list()
    return songs.map(toSongDTO)
  },

  async getById(id: string, userId?: string) {
    if (userId) {
      try {
        await SongRepo.recordCollaborator(id, userId)
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003')) throw e
      }
    }
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    return toSongWithNotesDTO(song)
  },

  async getNotes(id: string, from?: number, to?: number) {
    const notes = await SongRepo.listNotes(id, from, to)
    return notes.map(toNoteDTO)
  },

  async getEvents(id: string) {
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    const events = await SongRepo.listEvents(id)
    return events.map(toNoteEventDTO)
  },

  async remove(id: string, userId?: string) {
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    if (song.ownerId && song.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can delete this song')
    }
    try {
      await SongRepo.remove(id)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw ApiError.NotFound('Song not found')
      }
      throw e
    }
  },
}
