import reducer, {
  applyCollaboratorRemoved,
  applyCollaboratorUpsert,
  applyNoteUpsert,
  applySongRemoved,
  createSong,
  loadNotes,
  openSong,
  removeNote,
} from '~/store/songSlice'
import type { Collaborator, Note, Song, SongDetail } from '~/types/midi'

jest.mock('~/apis/midi', () => ({
  listSongs: jest.fn(),
  createSongApi: jest.fn(),
  getSong: jest.fn(),
  getNotesWindow: jest.fn(),
  createNoteApi: jest.fn(),
  updateNoteApi: jest.fn(),
  deleteNoteApi: jest.fn(),
  deleteSongApi: jest.fn(),
  setShareModeApi: jest.fn(),
  renameSongApi: jest.fn(),
}))

const song: SongDetail = {
  id: 's1',
  title: 'Song',
  bpm: 120,
  version: 1,
  shareMode: 'edit',
  ownerId: 'owner-1',
  ownerEmail: 'o@x.com',
  createdAt: '',
  updatedAt: '',
  noteCount: 5,
  collaborators: [],
}

function note(id: string): Note {
  return {
    id,
    songId: 's1',
    title: id,
    description: null,
    track: 1,
    time: 0,
    color: '#fff',
    createdAt: '',
    updatedAt: '',
  }
}

function opened() {
  return reducer(undefined, openSong.fulfilled(song, 'req', 's1'))
}

describe('songSlice', () => {
  it('openSong resets notes/chunks and bumps loadGeneration', () => {
    const state = opened()
    expect(state.current).toMatchObject({ id: 's1', notes: [] })
    expect(state.loadedChunks).toEqual([])
    expect(state.loadGeneration).toBe(1)
  })

  it('adding a note increments the live note count', () => {
    let state = opened()
    state = reducer(state, applyNoteUpsert(note('a')))
    expect(state.current?.notes).toHaveLength(1)
    expect(state.current?.noteCount).toBe(6)
  })

  it('updating an existing note does not change the count', () => {
    let state = opened()
    state = reducer(state, applyNoteUpsert(note('a')))
    state = reducer(state, applyNoteUpsert({ ...note('a'), track: 4 }))
    expect(state.current?.notes).toHaveLength(1)
    expect(state.current?.noteCount).toBe(6)
  })

  it('removing a loaded note decrements the count', () => {
    let state = opened()
    state = reducer(state, applyNoteUpsert(note('a')))
    state = reducer(state, removeNote.fulfilled('a', 'req', 'a'))
    expect(state.current?.notes).toHaveLength(0)
    expect(state.current?.noteCount).toBe(5)
  })

  it('drops a loadNotes response from a stale generation', () => {
    const state = opened() // loadGeneration === 1
    const stale = reducer(
      state,
      loadNotes.fulfilled(
        { songId: 's1', chunk: 0, notes: [note('x')], generation: 0 },
        'req',
        { songId: 's1', chunk: 0 },
      ),
    )
    expect(stale.current?.notes).toHaveLength(0)

    const fresh = reducer(
      state,
      loadNotes.fulfilled(
        { songId: 's1', chunk: 0, notes: [note('x')], generation: 1 },
        'req',
        { songId: 's1', chunk: 0 },
      ),
    )
    expect(fresh.current?.notes).toHaveLength(1)
    expect(fresh.loadedChunks).toEqual([0])
  })

  it('upserts and removes collaborators on the current song', () => {
    const collaborator: Collaborator = {
      userId: 'u2',
      email: 'b@x.com',
      status: 'pending',
      lastSeen: '',
    }
    let state = opened()
    state = reducer(state, applyCollaboratorUpsert({ songId: 's1', collaborator }))
    expect(state.current?.collaborators).toHaveLength(1)

    state = reducer(
      state,
      applyCollaboratorUpsert({ songId: 's1', collaborator: { ...collaborator, status: 'accepted' } }),
    )
    expect(state.current?.collaborators).toHaveLength(1)
    expect(state.current?.collaborators[0].status).toBe('accepted')

    state = reducer(state, applyCollaboratorRemoved({ songId: 's1', userId: 'u2' }))
    expect(state.current?.collaborators).toHaveLength(0)
  })

  it('createSong prepends a new song with an empty note count', () => {
    const created: Song = { ...song, id: 's2', noteCount: undefined as never } as Song
    const state = reducer(undefined, createSong.fulfilled(created, 'req', 'New'))
    expect(state.songs[0]).toMatchObject({ id: 's2', noteCount: 0, collaborators: [] })
  })

  it('applySongRemoved clears the current song and drops it from the list', () => {
    let state = reducer(undefined, createSong.fulfilled(song, 'req', 'x'))
    state = reducer(state, openSong.fulfilled(song, 'req', 's1'))
    state = reducer(state, applySongRemoved({ songId: 's1' }))
    expect(state.current).toBeNull()
    expect(state.songs.find((s) => s.id === 's1')).toBeUndefined()
  })
})
