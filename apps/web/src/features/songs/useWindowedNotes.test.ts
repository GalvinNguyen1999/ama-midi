import { renderHook } from '@testing-library/react'

import { useWindowedNotes } from '~/features/songs/useWindowedNotes'

const mockDispatch = jest.fn()

const songState = { loadGeneration: 0, loadedChunks: [] as number[] }

jest.mock('~/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (s: { song: typeof songState }) => unknown) =>
    selector({ song: songState }),
}))

jest.mock('~/store/songSlice', () => ({
  CHUNK_SECONDS: 30,
  loadNotes: (args: { songId: string; chunk: number }) => ({ type: 'song/loadNotes', payload: args }),
}))

function dispatchedChunks(): number[] {
  return mockDispatch.mock.calls.map((c) => (c[0] as { payload: { chunk: number } }).payload.chunk)
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function mountWithScroll() {
  const view = renderHook(() => useWindowedNotes('s1'))
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

  it('loads chunks covering the viewport (+overscan), nearest first', async () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    await flush()
    expect(dispatchedChunks().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('dispatches at most MAX_CONCURRENT requests before any resolve', () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    expect(dispatchedChunks()).toEqual([0, 1, 2])
  })

  it('does not re-request chunks already loaded', async () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    await flush()
    mockDispatch.mockClear()
    view.result.current.onScroll()
    await flush()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('reload() clears the request cache and fetches again', async () => {
    const view = mountWithScroll()
    view.result.current.onScroll()
    await flush()
    mockDispatch.mockClear()
    view.result.current.reload()
    await flush()
    expect(dispatchedChunks().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
