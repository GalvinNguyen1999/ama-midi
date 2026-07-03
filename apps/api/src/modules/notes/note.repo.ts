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

const SEED_COLORS = ['#7c3aed', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#06b6d4']

export const NoteRepo = {
  async bulkSeed(songId: string, count: number): Promise<number> {
    const rows: Prisma.NoteCreateManyInput[] = []
    const seen = new Set<string>()
    let guard = 0

    while (rows.length < count && guard < count * 4) {
      guard++
      const track = 1 + Math.floor(Math.random() * 8)
      const time = Math.round(Math.random() * 300000) / 1000
      const key = `${track}:${time}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        songId,
        title: `Seed ${rows.length + 1}`,
        track,
        time,
        color: SEED_COLORS[rows.length % SEED_COLORS.length],
      })
    }

    let inserted = 0
    for (let i = 0; i < rows.length; i += 5000) {
      const batch = await prisma.note.createMany({ data: rows.slice(i, i + 5000), skipDuplicates: true })
      inserted += batch.count
    }

    await prisma.song.update({ where: { id: songId }, data: { version: { increment: 1 } } })
    return inserted
  },

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
