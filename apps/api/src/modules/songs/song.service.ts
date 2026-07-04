import { Prisma } from '@prisma/client'

import { SongRepo } from './song.repo'
import { toNoteEventDTO, toSongDTO, toSongWithNotesDTO } from './song.types'

import { ApiError } from '~/core/http/ApiError'
import { hub } from '~/core/realtime/hub'
import { AuthRepo } from '~/modules/auth/auth.repo'
import { toNoteDTO } from '~/modules/notes/note.types'

export const SongService = {
  async create(input: { title: string; bpm?: number }, ownerId?: string) {
    const song = await SongRepo.create({ ...input, ownerId })
    return toSongDTO(song)
  },

  async list(userId?: string) {
    const songs = await SongRepo.list(userId ?? '')
    return songs.map(toSongWithNotesDTO)
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

  async assertCanEdit(songId: string, userId?: string) {
    const access = await SongRepo.findAccess(songId)
    if (!access) throw ApiError.NotFound('Song not found')
    if (access.shareMode === 'view' && access.ownerId && access.ownerId !== userId) {
      throw ApiError.Forbidden('This song is shared as view-only')
    }
  },

  async assertOwner(songId: string, userId?: string) {
    const access = await SongRepo.findAccess(songId)
    if (!access) throw ApiError.NotFound('Song not found')
    if (access.ownerId && access.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can change this song')
    }
  },

  async setShareMode(
    id: string,
    userId: string | undefined,
    shareMode: 'edit' | 'view',
    actor?: string,
  ) {
    const access = await SongRepo.findAccess(id)
    if (!access) throw ApiError.NotFound('Song not found')
    if (access.ownerId && access.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can change sharing')
    }
    const song = await SongRepo.setShareMode(id, shareMode)
    const dto = toSongDTO(song)

    hub.broadcast(id, {
      type: 'song.updated',
      songId: id,
      title: dto.title,
      shareMode: dto.shareMode,
      version: dto.version,
      change: 'share',
      actor,
    })

    return dto
  },

  async rename(id: string, userId: string | undefined, title: string, actor?: string) {
    await SongService.assertOwner(id, userId)
    const song = await SongRepo.updateTitle(id, title)
    const dto = toSongDTO(song)

    hub.broadcast(id, {
      type: 'song.updated',
      songId: id,
      title: dto.title,
      shareMode: dto.shareMode,
      version: dto.version,
      change: 'title',
      actor,
    })

    return dto
  },

  async invite(id: string, userId: string | undefined, email: string) {
    await SongService.assertOwner(id, userId)

    const invitee = await AuthRepo.findByEmail(email)
    if (!invitee) throw ApiError.NotFound('No account is registered with that email')
    if (invitee.id === userId) throw ApiError.BadRequest('You already own this song')

    const collaborator = await SongRepo.recordCollaborator(id, invitee.id)
    return { email: invitee.email, lastSeen: collaborator.lastSeen.toISOString() }
  },

  async remove(id: string, userId?: string, actor?: string) {
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

    hub.broadcast(id, { type: 'song.deleted', songId: id, actor })
  },
}
