import type { Note } from '@prisma/client'

export interface NoteDTO {
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

export interface NoteInput {
  title: string
  description?: string
  track: number
  time: number
  color?: string
}

export interface NoteUpdateInput {
  title?: string
  description?: string
  track?: number
  time?: number
  color?: string
}

export function toNoteDTO(n: Note): NoteDTO {
  return {
    id: n.id,
    songId: n.songId,
    title: n.title,
    description: n.description,
    track: n.track,
    time: n.time.toNumber(),
    color: n.color,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }
}
