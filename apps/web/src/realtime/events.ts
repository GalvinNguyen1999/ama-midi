import type { Note, PresenceUser } from '~/types/midi'

export type ServerEvent =
  | { type: 'note.created'; songId: string; note: Note; actor?: string }
  | { type: 'note.updated'; songId: string; note: Note; actor?: string }
  | { type: 'note.deleted'; songId: string; noteId: string; actor?: string }
  | {
      type: 'song.updated'
      songId: string
      title: string
      shareMode: 'edit' | 'view'
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
