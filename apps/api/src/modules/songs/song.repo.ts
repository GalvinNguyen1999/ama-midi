import { prisma } from '~/config/db'

const ownerSelect = { owner: { select: { email: true } } }

export const SongRepo = {
  create(data: { title: string; bpm?: number; ownerId?: string }) {
    return prisma.song.create({ data, include: ownerSelect })
  },

  list() {
    return prisma.song.findMany({ orderBy: { createdAt: 'desc' }, include: ownerSelect })
  },

  findById(id: string) {
    return prisma.song.findUnique({
      where: { id },
      include: {
        ...ownerSelect,
        notes: { orderBy: [{ track: 'asc' }, { time: 'asc' }] },
        collaborators: {
          include: { user: { select: { email: true } } },
          orderBy: { lastSeen: 'desc' },
        },
      },
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
