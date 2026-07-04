import { renderHook, act } from '@testing-library/react'
import { toast } from 'react-toastify'

import { seedNotesApi } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'
import { removeSong } from '~/store/songSlice'
import type { SongWithNotes } from '~/types/midi'

import { useSongActions } from './useSongActions'

jest.mock('~/apis/midi', () => ({ seedNotesApi: jest.fn() }))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), loading: jest.fn(() => 'tid'), update: jest.fn(), dismiss: jest.fn() },
}))

const mockSeed = seedNotesApi as jest.Mock
const mockUseDispatch = useAppDispatch as unknown as jest.Mock
const current = { id: 's1', notes: [] } as unknown as SongWithNotes

describe('useSongActions', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn().mockResolvedValue({ type: 'x' })
    mockUseDispatch.mockReturnValue(dispatch)
  })

  const setup = (navigate = jest.fn(), reload = jest.fn()) =>
    renderHook(() => useSongActions({ current, reload, navigate }))

  it('toggles the delete dialog', () => {
    const { result } = setup()
    act(() => result.current.openDelete())
    expect(result.current.deleteOpen).toBe(true)
    act(() => result.current.closeDelete())
    expect(result.current.deleteOpen).toBe(false)
  })

  it('deleteSong navigates back to the library on success', async () => {
    const navigate = jest.fn()
    dispatch.mockResolvedValue(removeSong.fulfilled('s1' as never, 'req', 's1'))
    const { result } = setup(navigate)
    await act(async () => {
      await result.current.deleteSong()
    })
    expect(toast.success).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/songs')
  })

  it('seed calls the api, reopens the song and reloads', async () => {
    mockSeed.mockResolvedValue({ inserted: 1000 })
    const reload = jest.fn()
    const { result } = setup(jest.fn(), reload)
    await act(async () => {
      await result.current.seed(1000)
    })
    expect(mockSeed).toHaveBeenCalledWith('s1', 1000)
    expect(reload).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalled()
  })
})
