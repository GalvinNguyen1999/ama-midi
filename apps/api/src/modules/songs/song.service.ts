import { Prisma } from '@prisma/client'

import { SongRepo } from './song.repo'
import { toNoteEventDTO, toPendingInviteDTO, toSongDTO, toSongWithNotesDTO } from './song.types'

import { ApiError } from '~/core/http/ApiError'
import { emit } from '~/core/realtime/emit'
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
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')

    if (userId && userId !== song.ownerId) {
      const membership = await SongRepo.findCollaborator(id, userId)
      if (membership?.status === 'pending') {
        throw ApiError.Forbidden('Accept the invitation to open this song')
      }
      await SongRepo.recordCollaborator(id, userId)
    }

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
    if (access.ownerId && access.ownerId === userId) return

    const membership = userId ? await SongRepo.findCollaborator(songId, userId) : null
    if (membership?.status === 'pending') {
      throw ApiError.Forbidden('Accept the invitation before editing')
    }
    if (access.shareMode === 'view' && access.ownerId) {
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

    emit.songUpdated(
      id,
      { title: dto.title, shareMode: dto.shareMode, version: dto.version },
      'share',
      actor,
    )

    return dto
  },

  async rename(id: string, userId: string | undefined, title: string, actor?: string) {
    await SongService.assertOwner(id, userId)
    const song = await SongRepo.updateTitle(id, title)
    const dto = toSongDTO(song)

    emit.songUpdated(
      id,
      { title: dto.title, shareMode: dto.shareMode, version: dto.version },
      'title',
      actor,
    )

    return dto
  },

  async invite(id: string, userId: string | undefined, email: string, actor?: string) {
    const access = await SongRepo.findAccess(id)
    if (!access) throw ApiError.NotFound('Song not found')
    if (access.ownerId && access.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can invite collaborators')
    }

    const invitee = await AuthRepo.findByEmail(email)
    if (!invitee) throw ApiError.NotFound('No account is registered with that email')
    if (invitee.id === userId) throw ApiError.BadRequest('You already own this song')

    const collaborator = await SongRepo.invitePending(id, invitee.id)

    emit.invited(invitee.id, id, access.title, actor ?? 'Someone')

    return {
      userId: invitee.id,
      email: invitee.email,
      status: 'pending',
      lastSeen: collaborator.lastSeen.toISOString(),
    }
  },

  async listMyInvites(userId: string) {
    const invites = await SongRepo.listPendingInvites(userId)
    return invites.map(toPendingInviteDTO)
  },

  async respondToInvite(id: string, userId: string, accept: boolean, actor?: string) {
    const membership = await SongRepo.findCollaborator(id, userId)
    if (!membership || membership.status !== 'pending') {
      throw ApiError.NotFound('No pending invitation for this song')
    }
    const access = await SongRepo.findAccess(id)

    if (accept) {
      await SongRepo.setCollaboratorStatus(id, userId, 'accepted')
    } else {
      await SongRepo.removeCollaborator(id, userId)
    }

    if (access?.ownerId) {
      emit.inviteResponded(access.ownerId, id, access.title, actor ?? 'Someone', userId, accept)
    }
  },

  async remove(id: string, userId?: string, actor?: string) {
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    if (song.ownerId && song.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can delete this song')
    }

    const members = await SongRepo.listCollaboratorIds(id)

    try {
      await SongRepo.remove(id)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw ApiError.NotFound('Song not found')
      }
      throw e
    }

    emit.songDeleted(
      id,
      members.map((m) => m.userId),
      actor,
    )
  },

  async removeCollaborator(id: string, userId: string | undefined, targetUserId: string) {
    const access = await SongRepo.findAccess(id)
    if (!access) throw ApiError.NotFound('Song not found')
    if (access.ownerId && access.ownerId !== userId) {
      throw ApiError.Forbidden('Only the owner can remove collaborators')
    }
    if (targetUserId === access.ownerId) {
      throw ApiError.BadRequest('The owner cannot be removed')
    }

    await SongRepo.removeCollaborator(id, targetUserId)
    emit.accessRevoked(targetUserId, id, access.title)
  },
}
