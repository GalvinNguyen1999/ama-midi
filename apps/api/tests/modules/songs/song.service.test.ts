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
})
