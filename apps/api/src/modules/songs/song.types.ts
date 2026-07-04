import type { NoteEvent, Song } from '@prisma/client'

export interface SongDTO {
  id: string
  title: string
  bpm: number
  version: number
  shareMode: string
  ownerId: string | null
  ownerEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface CollaboratorDTO {
  userId: string
  email: string
  status: string
  lastSeen: string
}

export interface PendingInviteDTO {
  songId: string
  title: string
  ownerEmail: string | null
}

export interface SongWithNotesDTO extends SongDTO {
  noteCount: number
  collaborators: CollaboratorDTO[]
}

type SongWithOwner = Song & { owner?: { email: string } | null }

interface CollaboratorRow {
  userId: string
  user: { email: string }
  status: string
  lastSeen: Date
}

interface PendingInviteRow {
  song: { id: string; title: string; owner: { email: string } | null }
}

type SongDetail = SongWithOwner & {
  _count: { notes: number }
  collaborators: CollaboratorRow[]
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

export function toSongDTO(s: SongWithOwner): SongDTO {
  return {
    id: s.id,
    title: s.title,
    bpm: s.bpm,
    version: s.version,
    shareMode: s.shareMode,
    ownerId: s.ownerId,
    ownerEmail: s.owner?.email ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export function toSongWithNotesDTO(s: SongDetail): SongWithNotesDTO {
  return {
    ...toSongDTO(s),
    noteCount: s._count.notes,
    collaborators: s.collaborators
      .filter((c) => c.userId !== s.ownerId)
      .map((c) => ({
        userId: c.userId,
        email: c.user.email,
        status: c.status,
        lastSeen: c.lastSeen.toISOString(),
      })),
  }
}

export function toPendingInviteDTO(row: PendingInviteRow): PendingInviteDTO {
  return {
    songId: row.song.id,
    title: row.song.title,
    ownerEmail: row.song.owner?.email ?? null,
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
