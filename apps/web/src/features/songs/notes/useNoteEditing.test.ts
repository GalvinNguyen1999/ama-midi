import { renderHook, act } from '@testing-library/react'

import { useAppDispatch } from '~/store/hooks'
import { addNote, editNote, removeNote } from '~/store/songSlice'
import type { Note, SongWithNotes } from '~/types/midi'

import { useNoteEditing } from './useNoteEditing'

jest.mock('~/apis/midi', () => ({}))
jest.mock('~/store/hooks')
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }))

const mockUseDispatch = useAppDispatch as unknown as jest.Mock

const note = {
  id: 'n1',
  songId: 's1',
  title: 'A',
  description: '',
  track: 1,
  time: 2,
  color: '#fff',
} as unknown as Note
const current = { id: 's1', notes: [note] } as unknown as SongWithNotes

describe('useNoteEditing', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    dispatch = jest.fn()
    mockUseDispatch.mockReturnValue(dispatch)
  })

  it('openCreate opens the dialog in create mode with the clicked cell', () => {
    const { result } = renderHook(() => useNoteEditing(current, jest.fn()))
    act(() => {
      result.current.openCreate(3, 42)
    })
    expect(result.current.dialog.open).toBe(true)
    expect(result.current.dialog.mode).toBe('create')
    expect(result.current.dialog.values.track).toBe(3)
    expect(result.current.dialog.values.time).toBe(42)
  })

  it('openEdit seeds the dialog from the note', () => {
    const { result } = renderHook(() => useNoteEditing(current, jest.fn()))
    act(() => {
      result.current.openEdit(note)
    })
    expect(result.current.dialog.mode).toBe('edit')
    expect(result.current.dialog.note).toBe(note)
    expect(result.current.dialog.values.title).toBe('A')
  })

  it('submit in create mode records a create entry', async () => {
    dispatch.mockResolvedValue(addNote.fulfilled(note as never, 'req', { songId: 's1', input: {} as never }))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.submit({ title: 'A', description: '', track: 1, time: 2, color: '#fff' })
    })
    expect(record).toHaveBeenCalledWith({ kind: 'create', note })
    expect(result.current.dialog.open).toBe(false)
  })

  it('deleteNote records a delete entry', async () => {
    dispatch.mockResolvedValue(removeNote.fulfilled('n1', 'req', 'n1'))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    act(() => {
      result.current.openEdit(note)
    })
    await act(async () => {
      await result.current.deleteNote()
    })
    expect(record).toHaveBeenCalledWith({ kind: 'delete', note })
  })

  it('moveNote records an update on success', async () => {
    dispatch.mockResolvedValue(editNote.fulfilled(note as never, 'req', { id: 'n1', input: {} as never }))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.moveNote(note, 4, 8)
    })
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ kind: 'update', id: 'n1' }))
  })

  it('moveNote reverts and skips recording when the edit is rejected', async () => {
    dispatch.mockResolvedValue(editNote.rejected(new Error('x'), 'req', { id: 'n1', input: {} as never }))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.moveNote(note, 4, 8)
    })
    expect(record).not.toHaveBeenCalled()
  })

  it('duplicate creates an offset copy and records a create', async () => {
    dispatch.mockResolvedValue(addNote.fulfilled(note as never, 'req', { songId: 's1', input: {} as never }))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.duplicate([note])
    })
    expect(record).toHaveBeenCalledWith({ kind: 'create', note })
  })

  it('moveMany optimistically moves and records an update per note', async () => {
    dispatch.mockResolvedValue(editNote.fulfilled(note as never, 'req', { id: 'n1', input: {} as never }))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.moveMany([{ note, track: 4, time: 8 }])
    })
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ kind: 'update', id: 'n1' }))
  })

  it('deleteMany records one delete per removed note', async () => {
    dispatch.mockResolvedValue(removeNote.fulfilled('n1', 'req', 'n1'))
    const record = jest.fn()
    const { result } = renderHook(() => useNoteEditing(current, record))
    await act(async () => {
      await result.current.deleteMany(['n1'])
    })
    expect(record).toHaveBeenCalledWith({ kind: 'delete', note })
  })
})
