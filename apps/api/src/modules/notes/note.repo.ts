import type { Note, Prisma } from '@prisma/client'

import { NoteInput, NoteUpdateInput } from './note.types'

import { prisma } from '~/config/db'

export interface NoteMutationResult {
  note: Note
  version: number
}

function notePayload(note: Note): Prisma.InputJsonValue {
  return {
    id: note.id,
    title: note.title,
    description: note.description,
    track: note.track,
    time: note.time.toNumber(),
    color: note.color,
  }
}

export const NoteRepo = {
  create(
    songId: string,
    data: Required<Pick<NoteInput, 'title' | 'track' | 'time' | 'color'>> &
      Pick<NoteInput, 'description'>,
    actor?: string,
  ): Promise<NoteMutationResult> {
    return prisma.$transaction(async (tx) => {
      const note = await tx.note.create({ data: { songId, ...data } })

      await tx.noteEvent.create({
        data: { songId, noteId: note.id, type: 'CREATE', payload: notePayload(note), actor: actor ?? null },
      })

      const song = await tx.song.update({ where: { id: songId }, data: { version: { increment: 1 } } })

      return { note, version: song.version }
    })
  },

  update(id: string, data: NoteUpdateInput, actor?: string): Promise<NoteMutationResult> {
    return prisma.$transaction(async (tx) => {
      const note = await tx.note.update({ where: { id }, data })

      await tx.noteEvent.create({
        data: { songId: note.songId, noteId: note.id, type: 'UPDATE', payload: notePayload(note), actor: actor ?? null },
      })

      const song = await tx.song.update({ where: { id: note.songId }, data: { version: { increment: 1 } } })

      return { note, version: song.version }
    })
  },

  remove(id: string, actor?: string): Promise<NoteMutationResult> {
    return prisma.$transaction(async (tx) => {
      const note = await tx.note.delete({ where: { id } })

      await tx.noteEvent.create({
        data: { songId: note.songId, noteId: note.id, type: 'DELETE', payload: notePayload(note), actor: actor ?? null },
      })

      const song = await tx.song.update({ where: { id: note.songId }, data: { version: { increment: 1 } } })
      
      return { note, version: song.version }
    })
  },
}
