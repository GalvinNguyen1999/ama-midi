import type { NoteDTO } from '~/modules/notes/note.types'

export type WsServerEvent =
  | { type: 'note.created'; songId: string; note: NoteDTO; version: number }
  | { type: 'note.updated'; songId: string; note: NoteDTO; version: number }
  | { type: 'note.deleted'; songId: string; noteId: string; version: number }

export type WsClientMessage =
  | { type: 'join'; songId: string }
  | { type: 'leave'; songId: string }
