import type { NoteDTO } from '~/modules/notes/note.types'

export interface PresenceUser {
  id: string
  email: string
}

export type WsServerEvent =
  | { type: 'note.created'; songId: string; note: NoteDTO; version: number; actor?: string }
  | { type: 'note.updated'; songId: string; note: NoteDTO; version: number; actor?: string }
  | { type: 'note.deleted'; songId: string; noteId: string; version: number; actor?: string }
  | {
      type: 'song.updated'
      songId: string
      title: string
      shareMode: string
      version: number
      change: 'title' | 'share'
      actor?: string
    }
  | { type: 'song.deleted'; songId: string; actor?: string }
  | { type: 'invited'; songId: string; title: string; by: string }
  | { type: 'presence'; songId: string; users: PresenceUser[] }

export type WsClientMessage =
  | { type: 'join'; songId: string; user?: PresenceUser }
  | { type: 'leave'; songId: string }
  | { type: 'subscribe'; userId: string }
