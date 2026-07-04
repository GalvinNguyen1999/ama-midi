import { renderHook, act } from '@testing-library/react'
import { toast } from 'react-toastify'

import { useAppDispatch } from '~/store/hooks'
import { renameSong } from '~/store/songSlice'

import { useSongTitle } from './useSongTitle'

jest.mock('~/apis/midi', () => ({}))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }))

const mockUseDispatch = useAppDispatch as unknown as jest.Mock
const song = { id: 's1', title: 'Original' }

describe('useSongTitle', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn()
    mockUseDispatch.mockReturnValue(dispatch)
  })

  it('start seeds the draft and enters edit mode for the owner', () => {
    const { result } = renderHook(() => useSongTitle(song, true))
    act(() => {
      result.current.start()
    })
    expect(result.current.editing).toBe(true)
    expect(result.current.draft).toBe('Original')
  })

  it('start is a no-op for non-owners', () => {
    const { result } = renderHook(() => useSongTitle(song, false))
    act(() => {
      result.current.start()
    })
    expect(result.current.editing).toBe(false)
  })

  it('commit renames when the title changed', async () => {
    dispatch.mockResolvedValue(
      renameSong.fulfilled({ id: 's1', title: 'New' } as never, 'req', { id: 's1', title: 'New' }),
    )
    const { result } = renderHook(() => useSongTitle(song, true))
    act(() => {
      result.current.setDraft('New')
    })
    await act(async () => {
      await result.current.commit()
    })
    expect(dispatch).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })

  it('commit skips the dispatch when the title is unchanged', async () => {
    const { result } = renderHook(() => useSongTitle(song, true))
    act(() => {
      result.current.setDraft('Original')
    })
    await act(async () => {
      await result.current.commit()
    })
    expect(dispatch).not.toHaveBeenCalled()
  })
})
