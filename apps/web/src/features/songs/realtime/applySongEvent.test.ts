import { toast } from 'react-toastify'

import { applySongEvent } from '~/features/songs/realtime/applySongEvent'
import type { ServerEvent } from '~/realtime/events'
import type { Note } from '~/types/midi'

jest.mock('react-toastify', () => ({ toast: { info: jest.fn() } }))
jest.mock('~/store/songSlice', () => ({
  applyNoteUpsert: (p: unknown) => ({ type: 'applyNoteUpsert', payload: p }),
  applyNoteRemove: (p: unknown) => ({ type: 'applyNoteRemove', payload: p }),
  applySongUpdate: (p: unknown) => ({ type: 'applySongUpdate', payload: p }),
  applySongRemoved: (p: unknown) => ({ type: 'applySongRemoved', payload: p }),
}))

const mockToast = toast.info as jest.Mock

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

function run(event: ServerEvent, self = 'me@x.com') {
  const dispatch = jest.fn()
  applySongEvent(dispatch as never, event, self)
  return dispatch
}

describe('applySongEvent', () => {
  afterEach(() => jest.clearAllMocks())

  it('upserts a created note and toasts when another user made it', () => {
    const dispatch = run({ type: 'note.created', songId: 's1', note: note('a'), actor: 'other@x.com' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'applyNoteUpsert', payload: note('a') })
    expect(mockToast).toHaveBeenCalledTimes(1)
  })

  it('does not toast for your own events', () => {
    run({ type: 'note.created', songId: 's1', note: note('a'), actor: 'me@x.com' })
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('removes a deleted note', () => {
    const dispatch = run({ type: 'note.deleted', songId: 's1', noteId: 'a', actor: 'other@x.com' })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'applyNoteRemove',
      payload: { songId: 's1', noteId: 'a' },
    })
  })

  it('applies a song update and toasts the change', () => {
    const dispatch = run({
      type: 'song.updated',
      songId: 's1',
      title: 'New',
      shareMode: 'view',
      version: 3,
      change: 'share',
      actor: 'other@x.com',
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'applySongUpdate',
      payload: { id: 's1', title: 'New', shareMode: 'view', version: 3 },
    })
    expect(mockToast).toHaveBeenCalledTimes(1)
  })

  it('removes the song on delete without a toast', () => {
    const dispatch = run({ type: 'song.deleted', songId: 's1', actor: 'other@x.com' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'applySongRemoved', payload: { songId: 's1' } })
    expect(mockToast).not.toHaveBeenCalled()
  })
})
