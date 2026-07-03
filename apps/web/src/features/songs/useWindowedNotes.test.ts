import { renderHook } from '@testing-library/react'

import { useWindowedNotes } from '~/features/songs/useWindowedNotes'

const mockDispatch = jest.fn()

jest.mock('~/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('~/store/songSlice', () => ({
  CHUNK_SECONDS: 30,
  loadNotes: (args: { songId: string; chunk: number }) => ({ type: 'song/loadNotes', payload: args }),
}))

function dispatchedChunks(): number[] {
  return mockDispatch.mock.calls.map((c) => (c[0] as { payload: { chunk: number } }).payload.chunk)
}

function mountWithScroll() {
  const view = renderHook(() => useWindowedNotes('s1', 's1'))
  view.result.current.scrollRef.current = {
    scrollTop: 0,
    clientHeight: 700,
    scrollTo: jest.fn(),
  } as unknown as HTMLDivElement
  mockDispatch.mockClear()
  return view
}

describe('useWindowedNotes', () => {
  beforeEach(() => {
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
  })

  it('loads chunks covering the viewport (+overscan) on scroll', () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    expect(dispatchedChunks()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('does not re-request chunks already loaded', () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    mockDispatch.mockClear()
    view.result.current.onScroll()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('reload() clears the request cache and fetches again', () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    mockDispatch.mockClear()
    view.result.current.reload()
    expect(dispatchedChunks()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
