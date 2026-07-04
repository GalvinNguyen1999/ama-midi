import { renderHook, act } from '@testing-library/react'
import { toast } from 'react-toastify'

import { getSuggestionsApi } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'
import { addNote } from '~/store/songSlice'

import { useSuggestions } from './useSuggestions'

jest.mock('~/apis/midi', () => ({
  getSuggestionsApi: jest.fn(),
  createNoteApi: jest.fn(),
  getSong: jest.fn(),
}))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}))

const mockGetSuggestions = getSuggestionsApi as jest.Mock
const mockUseDispatch = useAppDispatch as unknown as jest.Mock

const note = { id: 'n1', songId: 's1', track: 0, time: 1, color: '#fff', title: 'Note' }
const fulfilled = () => addNote.fulfilled(note as never, 'req', { songId: 's1', input: {} as never })

describe('useSuggestions', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn()
    mockUseDispatch.mockReturnValue(dispatch)
  })

  it('does nothing without a songId', async () => {
    const { result } = renderHook(() => useSuggestions(undefined, jest.fn()))
    await act(async () => {
      await result.current.suggest()
    })
    expect(mockGetSuggestions).not.toHaveBeenCalled()
  })

  it('loads suggestions on suggest', async () => {
    mockGetSuggestions.mockResolvedValue([{ track: 0, time: 1, color: '#fff' }])
    const { result } = renderHook(() => useSuggestions('s1', jest.fn()))
    await act(async () => {
      await result.current.suggest()
    })
    expect(result.current.suggestions).toHaveLength(1)
  })

  it('shows an info toast when there is no suggestion', async () => {
    mockGetSuggestions.mockResolvedValue([])
    const { result } = renderHook(() => useSuggestions('s1', jest.fn()))
    await act(async () => {
      await result.current.suggest()
    })
    expect(toast.info).toHaveBeenCalled()
    expect(result.current.suggestions).toHaveLength(0)
  })

  it('accept adds the note, notifies onCreated and drops it from the list', async () => {
    dispatch.mockResolvedValue(fulfilled())
    mockGetSuggestions.mockResolvedValue([{ track: 0, time: 1, color: '#fff' }])
    const onCreated = jest.fn()
    const { result } = renderHook(() => useSuggestions('s1', onCreated))
    await act(async () => {
      await result.current.suggest()
    })
    await act(async () => {
      await result.current.accept({ track: 0, time: 1, color: '#fff' })
    })
    expect(onCreated).toHaveBeenCalledWith(note)
    expect(result.current.suggestions).toHaveLength(0)
  })

  it('acceptAll adds every suggestion then clears the list', async () => {
    dispatch.mockResolvedValue(fulfilled())
    mockGetSuggestions.mockResolvedValue([
      { track: 0, time: 1, color: '#fff' },
      { track: 1, time: 2, color: '#fff' },
    ])
    const { result } = renderHook(() => useSuggestions('s1', jest.fn()))
    await act(async () => {
      await result.current.suggest()
    })
    await act(async () => {
      await result.current.acceptAll()
    })
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(result.current.suggestions).toHaveLength(0)
  })
})
