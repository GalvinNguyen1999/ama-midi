import { renderHook, act } from '@testing-library/react'
import { toast } from 'react-toastify'

import { inviteCollaboratorApi, removeCollaboratorApi } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'

import { useSharing } from './useSharing'

jest.mock('~/apis/midi', () => ({
  inviteCollaboratorApi: jest.fn(),
  removeCollaboratorApi: jest.fn(),
}))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), info: jest.fn() } }))

const mockInvite = inviteCollaboratorApi as jest.Mock
const mockRemove = removeCollaboratorApi as jest.Mock
const mockUseDispatch = useAppDispatch as unknown as jest.Mock
const song = { id: 's1', shareMode: 'edit' as const }

describe('useSharing', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn().mockResolvedValue({ type: 'x' })
    mockUseDispatch.mockReturnValue(dispatch)
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
  })

  it('copyLink writes the share url to the clipboard', async () => {
    const { result } = renderHook(() => useSharing(song))
    await act(async () => {
      await result.current.copyLink()
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/songs/s1'))
    expect(toast.success).toHaveBeenCalled()
  })

  it('invite calls the api, dispatches and clears the field', async () => {
    mockInvite.mockResolvedValue({ userId: 'u2', email: 'a@b.com', status: 'pending' })
    const { result } = renderHook(() => useSharing(song))
    act(() => {
      result.current.setInviteEmail('a@b.com')
    })
    await act(async () => {
      await result.current.invite()
    })
    expect(mockInvite).toHaveBeenCalledWith('s1', 'a@b.com')
    expect(dispatch).toHaveBeenCalled()
    expect(result.current.inviteEmail).toBe('')
  })

  it('removeCollaborator calls the api and dispatches removal', async () => {
    mockRemove.mockResolvedValue(undefined)
    const { result } = renderHook(() => useSharing(song))
    await act(async () => {
      await result.current.removeCollaborator('u2', 'a@b.com')
    })
    expect(mockRemove).toHaveBeenCalledWith('s1', 'u2')
    expect(dispatch).toHaveBeenCalled()
  })

  it('setShare skips when the mode is unchanged', async () => {
    const { result } = renderHook(() => useSharing(song))
    await act(async () => {
      await result.current.setShare('edit')
    })
    expect(dispatch).not.toHaveBeenCalled()
  })
})
