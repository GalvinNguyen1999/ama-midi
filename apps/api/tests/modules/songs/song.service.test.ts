import { SongRepo } from '~/modules/songs/song.repo'
import { SongService } from '~/modules/songs/song.service'

jest.mock('~/config/db', () => ({ prisma: {} }))
jest.mock('~/modules/songs/song.repo')

const mockedRepo = SongRepo as jest.Mocked<typeof SongRepo>

describe('SongService', () => {
  afterEach(() => jest.clearAllMocks())

  it('getById throws 404 when song is missing', async () => {
    mockedRepo.findById.mockResolvedValue(null as never)
    await expect(SongService.getById('missing')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('remove throws 404 when song is missing', async () => {
    mockedRepo.findById.mockResolvedValue(null as never)
    await expect(SongService.remove('missing', 'user-1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('remove throws 403 when caller is not the owner', async () => {
    mockedRepo.findById.mockResolvedValue({ id: 's1', ownerId: 'owner-1' } as never)
    await expect(SongService.remove('s1', 'intruder')).rejects.toMatchObject({ statusCode: 403 })
    expect(mockedRepo.remove).not.toHaveBeenCalled()
  })

  it('remove deletes when caller is the owner', async () => {
    mockedRepo.findById.mockResolvedValue({ id: 's1', ownerId: 'owner-1' } as never)
    mockedRepo.remove.mockResolvedValue({} as never)
    await SongService.remove('s1', 'owner-1')
    expect(mockedRepo.remove).toHaveBeenCalledWith('s1')
  })

  it('getNotes maps repo rows to note DTOs within the requested range', async () => {
    mockedRepo.listNotes.mockResolvedValue([
      {
        id: 'n1',
        songId: 's1',
        title: 'A',
        description: null,
        track: 1,
        time: { toNumber: () => 12 },
        color: '#7c3aed',
        createdAt: new Date('2020-01-01T00:00:00Z'),
        updatedAt: new Date('2020-01-01T00:00:00Z'),
      },
    ] as never)

    const notes = await SongService.getNotes('s1', 0, 30)

    expect(mockedRepo.listNotes).toHaveBeenCalledWith('s1', 0, 30)
    expect(notes[0]).toMatchObject({ id: 'n1', track: 1, time: 12 })
  })
})
