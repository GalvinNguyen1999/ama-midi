import type { Note, NoteEvent, Song } from '@prisma/client'

import { NoteDTO, toNoteDTO } from '~/modules/notes/note.types'

export interface SongDTO {
  id: string
  title: string
  bpm: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface SongWithNotesDTO extends SongDTO {
  notes: NoteDTO[]
}

export interface NoteEventDTO {
  id: string
  songId: string
  noteId: string | null
  type: string
  payload: unknown
  actor: string | null
  createdAt: string
}

export function toSongDTO(s: Song): SongDTO {
  return {
    id: s.id,
    title: s.title,
    bpm: s.bpm,
    version: s.version,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export function toSongWithNotesDTO(s: Song & { notes: Note[] }): SongWithNotesDTO {
  return { ...toSongDTO(s), notes: s.notes.map(toNoteDTO) }
}

export function toNoteEventDTO(e: NoteEvent): NoteEventDTO {
  return {
    id: e.id.toString(),
    songId: e.songId,
    noteId: e.noteId,
    type: e.type,
    payload: e.payload,
    actor: e.actor,
    createdAt: e.createdAt.toISOString(),
  }
}
