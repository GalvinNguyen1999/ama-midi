import { hub } from './hub'

import type { NoteDTO } from '~/modules/notes/note.types'

export const emit = {
  noteCreated(songId: string, note: NoteDTO, version: number, actor?: string) {
    hub.broadcast(songId, { type: 'note.created', songId, note, version, actor })
  },

  noteUpdated(songId: string, note: NoteDTO, version: number, actor?: string) {
    hub.broadcast(songId, { type: 'note.updated', songId, note, version, actor })
  },

  noteDeleted(songId: string, noteId: string, version: number, actor?: string) {
    hub.broadcast(songId, { type: 'note.deleted', songId, noteId, version, actor })
  },

  songUpdated(
    songId: string,
    data: { title: string; shareMode: string; version: number },
    change: 'title' | 'share',
    actor?: string,
  ) {
    hub.broadcast(songId, { type: 'song.updated', songId, change, actor, ...data })
  },

  songDeleted(songId: string, memberIds: string[], actor?: string) {
    hub.broadcast(songId, { type: 'song.deleted', songId, actor })
    for (const userId of memberIds) hub.notifyUser(userId, { type: 'song.removed', songId })
  },

  accessRevoked(userId: string, songId: string, title: string) {
    hub.notifyUser(userId, { type: 'access.revoked', songId, title })
  },

  invited(userId: string, songId: string, title: string, by: string) {
    hub.notifyUser(userId, { type: 'invited', songId, title, by })
  },

  inviteResponded(
    ownerId: string,
    songId: string,
    title: string,
    by: string,
    userId: string,
    accepted: boolean,
  ) {
    hub.notifyUser(ownerId, { type: 'invite.responded', songId, title, by, userId, accepted })
  },
}
