import { Prisma } from '@prisma/client'

import { ApiError } from '~/core/http/ApiError'
import { NoteRepo } from '~/modules/notes/note.repo'
import { NoteService } from '~/modules/notes/note.service'

jest.mock('~/config/db', () => ({ prisma: {} }))
jest.mock('~/modules/notes/note.repo')

const mockedRepo = NoteRepo as jest.Mocked<typeof NoteRepo>

const fakeNote = {
  id: 'n1',
  songId: 's1',
  title: 'A',
  description: null,
  track: 1,
  time: { toNumber: () => 5 },
  color: '#7c3aed',
  createdAt: new Date('2020-01-01T00:00:00Z'),
  updatedAt: new Date('2020-01-01T00:00:00Z'),
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('err', { code, clientVersion: 'x' })
}

describe('NoteService', () => {
  afterEach(() => jest.clearAllMocks())

  it('create returns a note DTO with defaulted color', async () => {
    mockedRepo.create.mockResolvedValue(fakeNote as never)
    const dto = await NoteService.create('s1', { title: 'A', track: 1, time: 5 })
    expect(dto).toMatchObject({ id: 'n1', track: 1, time: 5, color: '#7c3aed' })
    expect(mockedRepo.create).toHaveBeenCalledTimes(1)
  })

  it('maps duplicate (track,time) P2002 to 409 Conflict', async () => {
    mockedRepo.create.mockRejectedValue(prismaError('P2002'))
    await expect(NoteService.create('s1', { title: 'A', track: 1, time: 5 })).rejects.toMatchObject({
      statusCode: 409,
    })
  })

  it('maps missing song P2003 to 404 on create', async () => {
    mockedRepo.create.mockRejectedValue(prismaError('P2003'))
    await expect(NoteService.create('s1', { title: 'A', track: 1, time: 5 })).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('maps missing note P2025 to 404 on update', async () => {
    mockedRepo.update.mockRejectedValue(prismaError('P2025'))
    await expect(NoteService.update('n1', { title: 'B' })).rejects.toMatchObject({ statusCode: 404 })
  })
})
