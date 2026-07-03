import { act, renderHook } from '@testing-library/react'

import { useSongRealtime } from '~/features/songs/useSongRealtime'
import type { Note } from '~/types/midi'

const mockDispatch = jest.fn()
const mockToastInfo = jest.fn()

jest.mock('~/store/hooks', () => ({ useAppDispatch: () => mockDispatch }))
jest.mock('~/store/songSlice', () => ({
  applyNoteUpsert: (note: unknown) => ({ type: 'applyNoteUpsert', payload: note }),
  applyNoteRemove: (payload: unknown) => ({ type: 'applyNoteRemove', payload }),
}))
jest.mock('react-toastify', () => ({ toast: { info: (...a: unknown[]) => mockToastInfo(...a) } }))
jest.mock('~/utils/env', () => ({ WS_URL: 'ws://test' }))

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static OPEN = 1
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  readyState = 1
  sent: string[] = []
  constructor() {
    MockWebSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {}
}

const note: Note = {
  id: 'n1',
  songId: 's1',
  title: 'A',
  description: null,
  track: 1,
  time: 1,
  color: '#fff',
  createdAt: '',
  updatedAt: '',
}

describe('useSongRealtime', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
  })

  const last = () => MockWebSocket.instances[0]

  it('joins the room and marks connected on open', () => {
    const { result } = renderHook(() => useSongRealtime('s1', { id: 'u1', email: 'me@x.com' }))
    act(() => last().onopen?.())
    expect(result.current.connected).toBe(true)
    expect(JSON.parse(last().sent[0])).toMatchObject({ type: 'join', songId: 's1', user: { id: 'u1' } })
  })

  it('updates presence from a presence event', () => {
    const { result } = renderHook(() => useSongRealtime('s1', { id: 'u1', email: 'me@x.com' }))
    const users = [{ id: 'u2', email: 'a@b.com' }]
    act(() => last().onmessage?.({ data: JSON.stringify({ type: 'presence', songId: 's1', users }) }))
    expect(result.current.presence).toEqual(users)
  })

  it('applies and toasts a note change from another user', () => {
    renderHook(() => useSongRealtime('s1', { id: 'u1', email: 'me@x.com' }))
    act(() =>
      last().onmessage?.({
        data: JSON.stringify({ type: 'note.created', songId: 's1', note, actor: 'other@x.com' }),
      }),
    )
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'applyNoteUpsert', payload: note })
    expect(mockToastInfo).toHaveBeenCalled()
  })

  it('does not toast for the current user\'s own change', () => {
    renderHook(() => useSongRealtime('s1', { id: 'u1', email: 'me@x.com' }))
    act(() =>
      last().onmessage?.({
        data: JSON.stringify({ type: 'note.created', songId: 's1', note, actor: 'me@x.com' }),
      }),
    )
    expect(mockToastInfo).not.toHaveBeenCalled()
  })
})
