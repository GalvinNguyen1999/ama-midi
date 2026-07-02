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
  createdAt: string
  updatedAt: string
}

export interface SongWithNotes extends Song {
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
