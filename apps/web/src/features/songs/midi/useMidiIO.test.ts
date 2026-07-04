import { renderHook, act } from '@testing-library/react'
import { toast } from 'react-toastify'

import { getAllNotes, importMidiApi } from '~/apis/midi'
import { notesToMidi } from '~/features/songs/midi/midi'
import { useAppDispatch } from '~/store/hooks'

import { useMidiIO } from './useMidiIO'

jest.mock('~/apis/midi', () => ({
  getAllNotes: jest.fn(),
  importMidiApi: jest.fn(),
  getSong: jest.fn(),
}))
jest.mock('~/features/songs/midi/midi', () => ({ notesToMidi: jest.fn() }))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({
  toast: {
    loading: jest.fn(() => 'tid'),
    update: jest.fn(),
    dismiss: jest.fn(),
  },
}))

const mockGetAllNotes = getAllNotes as jest.Mock
const mockImportMidi = importMidiApi as jest.Mock
const mockNotesToMidi = notesToMidi as jest.Mock
const mockUseDispatch = useAppDispatch as unknown as jest.Mock

describe('useMidiIO', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn().mockResolvedValue(undefined)
    mockUseDispatch.mockReturnValue(dispatch)
    globalThis.URL.createObjectURL = jest.fn(() => 'blob:x')
    globalThis.URL.revokeObjectURL = jest.fn()
  })

  const setup = (reload = jest.fn()) =>
    renderHook(() => useMidiIO({ songId: 's1', title: 'My Song', bpm: 120, reload }))

  it('exports notes and reports success', async () => {
    mockGetAllNotes.mockResolvedValue([{ id: 'n', track: 0, time: 1 }])
    mockNotesToMidi.mockReturnValue(new Uint8Array([1, 2, 3]))
    const { result } = setup()
    await act(async () => {
      await result.current.exportMidi()
    })
    expect(mockGetAllNotes).toHaveBeenCalledWith('s1')
    expect(toast.update).toHaveBeenCalledWith('tid', expect.objectContaining({ type: 'success' }))
  })

  it('does not download when there are no notes', async () => {
    mockGetAllNotes.mockResolvedValue([])
    const { result } = setup()
    await act(async () => {
      await result.current.exportMidi()
    })
    expect(mockNotesToMidi).not.toHaveBeenCalled()
    expect(toast.update).toHaveBeenCalledWith('tid', expect.objectContaining({ type: 'info' }))
  })

  it('imports a file then reloads the song', async () => {
    mockImportMidi.mockResolvedValue({ inserted: 5 })
    const reload = jest.fn()
    const { result } = setup(reload)
    const file = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(2)) }
    const target = { files: [file], value: 'a.mid' }
    await act(async () => {
      await result.current.onFile({ target } as unknown as React.ChangeEvent<HTMLInputElement>)
    })
    expect(mockImportMidi).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalled()
    expect(reload).toHaveBeenCalled()
    expect(target.value).toBe('')
  })

  it('ignores an empty file selection', async () => {
    const { result } = setup()
    const target = { files: [], value: '' }
    await act(async () => {
      await result.current.onFile({ target } as unknown as React.ChangeEvent<HTMLInputElement>)
    })
    expect(mockImportMidi).not.toHaveBeenCalled()
  })
})
