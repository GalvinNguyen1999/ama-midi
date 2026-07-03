import type { Note, NoteEvent, Song } from '@prisma/client'

import { NoteDTO, toNoteDTO } from '~/modules/notes/note.types'

export interface SongDTO {
  id: string
  title: string
  bpm: number
  version: number
  ownerId: string | null
  ownerEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface CollaboratorDTO {
  email: string
  lastSeen: string
}

export interface SongWithNotesDTO extends SongDTO {
  notes: NoteDTO[]
  collaborators: CollaboratorDTO[]
}

type SongWithOwner = Song & { owner?: { email: string } | null }

interface CollaboratorRow {
  user: { email: string }
  lastSeen: Date
}

type SongDetail = SongWithOwner & { notes: Note[]; collaborators: CollaboratorRow[] }

export interface NoteEventDTO {
  id: string
  songId: string
  noteId: string | null
  type: string
  payload: unknown
  actor: string | null
  createdAt: string
}

export function toSongDTO(s: SongWithOwner): SongDTO {
  return {
    id: s.id,
    title: s.title,
    bpm: s.bpm,
    version: s.version,
    ownerId: s.ownerId,
    ownerEmail: s.owner?.email ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export function toSongWithNotesDTO(s: SongDetail): SongWithNotesDTO {
  return {
    ...toSongDTO(s),
    notes: s.notes.map(toNoteDTO),
    collaborators: s.collaborators.map((c) => ({
      email: c.user.email,
      lastSeen: c.lastSeen.toISOString(),
    })),
  }
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
