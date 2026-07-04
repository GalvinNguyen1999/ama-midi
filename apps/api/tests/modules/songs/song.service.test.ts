import { AuthRepo } from '~/modules/auth/auth.repo'
import { SongRepo } from '~/modules/songs/song.repo'
import { SongService } from '~/modules/songs/song.service'

jest.mock('~/config/db', () => ({ prisma: {} }))
jest.mock('~/modules/songs/song.repo')
jest.mock('~/modules/auth/auth.repo')

const mockedRepo = SongRepo as jest.Mocked<typeof SongRepo>
const mockedAuth = AuthRepo as jest.Mocked<typeof AuthRepo>

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
    mockedRepo.listCollaboratorIds.mockResolvedValue([] as never)
    mockedRepo.remove.mockResolvedValue({} as never)
    await SongService.remove('s1', 'owner-1')
    expect(mockedRepo.remove).toHaveBeenCalledWith('s1')
  })

  it('removeCollaborator throws 403 when the caller is not the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    await expect(SongService.removeCollaborator('s1', 'intruder', 'u2')).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(mockedRepo.removeCollaborator).not.toHaveBeenCalled()
  })

  it('removeCollaborator refuses to remove the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({
      ownerId: 'owner-1',
      shareMode: 'edit',
      title: 'Song',
    } as never)
    await expect(SongService.removeCollaborator('s1', 'owner-1', 'owner-1')).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(mockedRepo.removeCollaborator).not.toHaveBeenCalled()
  })

  it('removeCollaborator deletes the row when the caller is the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({
      ownerId: 'owner-1',
      shareMode: 'edit',
      title: 'Song',
    } as never)
    mockedRepo.removeCollaborator.mockResolvedValue({ count: 1 } as never)

    await SongService.removeCollaborator('s1', 'owner-1', 'u2')
    expect(mockedRepo.removeCollaborator).toHaveBeenCalledWith('s1', 'u2')
  })

  it('assertCanEdit throws 404 when the song is missing', async () => {
    mockedRepo.findAccess.mockResolvedValue(null as never)
    await expect(SongService.assertCanEdit('missing', 'user-1')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('assertCanEdit throws 403 for a non-owner when the song is view-only', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'view' } as never)
    await expect(SongService.assertCanEdit('s1', 'intruder')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('assertCanEdit allows a non-owner when the song is editable', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    await expect(SongService.assertCanEdit('s1', 'guest')).resolves.toBeUndefined()
  })

  it('assertCanEdit allows the owner even when view-only', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'view' } as never)
    await expect(SongService.assertCanEdit('s1', 'owner-1')).resolves.toBeUndefined()
  })

  it('setShareMode throws 403 when the caller is not the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    await expect(SongService.setShareMode('s1', 'intruder', 'view')).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(mockedRepo.setShareMode).not.toHaveBeenCalled()
  })

  it('setShareMode updates when the caller is the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    mockedRepo.setShareMode.mockResolvedValue({
      id: 's1',
      title: 'A',
      bpm: 120,
      version: 0,
      shareMode: 'view',
      ownerId: 'owner-1',
      owner: { email: 'o@x.com' },
      createdAt: new Date('2020-01-01T00:00:00Z'),
      updatedAt: new Date('2020-01-01T00:00:00Z'),
    } as never)

    const dto = await SongService.setShareMode('s1', 'owner-1', 'view')

    expect(mockedRepo.setShareMode).toHaveBeenCalledWith('s1', 'view')
    expect(dto).toMatchObject({ id: 's1', shareMode: 'view' })
  })

  it('rename throws 403 when the caller is not the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    await expect(SongService.rename('s1', 'intruder', 'New')).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(mockedRepo.updateTitle).not.toHaveBeenCalled()
  })

  it('rename updates the title when the caller is the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'view' } as never)
    mockedRepo.updateTitle.mockResolvedValue({
      id: 's1',
      title: 'New',
      bpm: 120,
      version: 3,
      shareMode: 'view',
      ownerId: 'owner-1',
      owner: { email: 'o@x.com' },
      createdAt: new Date('2020-01-01T00:00:00Z'),
      updatedAt: new Date('2020-01-01T00:00:00Z'),
    } as never)

    const dto = await SongService.rename('s1', 'owner-1', 'New')

    expect(mockedRepo.updateTitle).toHaveBeenCalledWith('s1', 'New')
    expect(dto).toMatchObject({ id: 's1', title: 'New' })
  })

  it('invite throws 403 when the caller is not the owner', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    await expect(SongService.invite('s1', 'intruder', 'b@x.com')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('invite throws 404 when no account has that email', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    mockedAuth.findByEmail.mockResolvedValue(null as never)
    await expect(SongService.invite('s1', 'owner-1', 'ghost@x.com')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('invite adds an existing user as a collaborator', async () => {
    mockedRepo.findAccess.mockResolvedValue({ ownerId: 'owner-1', shareMode: 'edit' } as never)
    mockedAuth.findByEmail.mockResolvedValue({ id: 'u2', email: 'b@x.com' } as never)
    mockedRepo.recordCollaborator.mockResolvedValue({
      lastSeen: new Date('2020-01-01T00:00:00Z'),
    } as never)

    const dto = await SongService.invite('s1', 'owner-1', 'b@x.com')

    expect(mockedRepo.recordCollaborator).toHaveBeenCalledWith('s1', 'u2')
    expect(dto).toMatchObject({ email: 'b@x.com' })
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
