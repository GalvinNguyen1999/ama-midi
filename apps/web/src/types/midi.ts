export interface Note {
  id: string
  songId: string
  title: string
  description: string | null
  track: number
  time: number
  color: string
  createdAt: string
  updatedAt: string
}

export interface Song {
  id: string
  title: string
  bpm: number
  version: number
  shareMode: 'edit' | 'view'
  ownerId: string | null
  ownerEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface PresenceUser {
  id: string
  email: string
}

export interface Collaborator {
  email: string
  lastSeen: string
}

export interface SongDetail extends Song {
  noteCount: number
  collaborators: Collaborator[]
}

export interface SongWithNotes extends SongDetail {
  notes: Note[]
}

export interface NoteInput {
  title: string
  description?: string
  track: number
  time: number
  color?: string
}

export type NoteUpdate = Partial<NoteInput>

export interface NoteEvent {
  id: string
  songId: string
  noteId: string | null
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  payload: { title?: string; track?: number; time?: number } | null
  actor: string | null
  createdAt: string
}
