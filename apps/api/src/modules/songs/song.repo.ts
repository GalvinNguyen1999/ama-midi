import { prisma } from '~/config/db'

export const SongRepo = {
  create(data: { title: string; bpm?: number }) {
    return prisma.song.create({ data })
  },

  list() {
    return prisma.song.findMany({ orderBy: { createdAt: 'desc' } })
  },

  findById(id: string) {
    return prisma.song.findUnique({
      where: { id },
      include: { notes: { orderBy: [{ track: 'asc' }, { time: 'asc' }] } },
    })
  },

  listEvents(songId: string) {
    return prisma.noteEvent.findMany({ where: { songId }, orderBy: { id: 'asc' } })
  },
}
