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
      bpm?: number
      change: 'title' | 'share' | 'bpm'
      actor?: string
    }
  | { type: 'song.deleted'; songId: string; actor?: string }
  | { type: 'song.removed'; songId: string }
  | { type: 'access.revoked'; songId: string; title: string }
  | { type: 'invited'; songId: string; title: string; by: string }
  | {
      type: 'invite.responded'
      songId: string
      title: string
      by: string
      userId: string
      accepted: boolean
    }
  | { type: 'presence'; songId: string; users: PresenceUser[] }
  | { type: 'cursor'; songId: string; user: PresenceUser; track: number | null; time: number | null }

export type WsClientMessage =
  | { type: 'join'; songId: string; user?: PresenceUser }
  | { type: 'leave'; songId: string }
  | { type: 'subscribe'; userId: string }
  | { type: 'cursor'; songId: string; user: PresenceUser; track: number | null; time: number | null }
