import { prisma } from '~/config/db'

const ownerSelect = { owner: { select: { email: true } } }

export const SongRepo = {
  create(data: { title: string; bpm?: number; ownerId?: string }) {
    return prisma.song.create({ data, include: ownerSelect })
  },

  list(userId: string) {
    return prisma.song.findMany({
      where: { OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        ...ownerSelect,
        _count: { select: { notes: true } },
        collaborators: {
          include: { user: { select: { email: true } } },
          orderBy: { lastSeen: 'desc' },
        },
      },
    })
  },

  findById(id: string) {
    return prisma.song.findUnique({
      where: { id },
      include: {
        ...ownerSelect,
        _count: { select: { notes: true } },
        collaborators: {
          include: { user: { select: { email: true } } },
          orderBy: { lastSeen: 'desc' },
        },
      },
    })
  },

  listNotes(songId: string, from?: number, to?: number) {
    const time =
      from != null || to != null
        ? { gte: from ?? undefined, lte: to ?? undefined }
        : undefined
    return prisma.note.findMany({
      where: { songId, ...(time ? { time } : {}) },
      orderBy: [{ track: 'asc' }, { time: 'asc' }],
    })
  },

  findAccess(id: string) {
    return prisma.song.findUnique({ where: { id }, select: { ownerId: true, shareMode: true } })
  },

  setShareMode(id: string, shareMode: string) {
    return prisma.song.update({ where: { id }, data: { shareMode }, include: ownerSelect })
  },

  updateTitle(id: string, title: string) {
    return prisma.song.update({
      where: { id },
      data: { title, version: { increment: 1 } },
      include: ownerSelect,
    })
  },

  recordCollaborator(songId: string, userId: string) {
    const now = new Date()
    return prisma.songCollaborator.upsert({
      where: { songId_userId: { songId, userId } },
      create: { songId, userId, lastSeen: now },
      update: { lastSeen: now },
    })
  },

  listEvents(songId: string) {
    return prisma.noteEvent.findMany({ where: { songId }, orderBy: { id: 'asc' } })
  },

  remove(id: string) {
    return prisma.song.delete({ where: { id } })
  },
}
