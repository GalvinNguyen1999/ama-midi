import { act, renderHook } from '@testing-library/react'

import { useEditorHistory, type HistoryOps } from '~/features/songs/notes/useEditorHistory'
import type { Note } from '~/types/midi'

function makeNote(id: string, track = 1, time = 0): Note {
  return {
    id,
    songId: 's1',
    title: id,
    description: null,
    track,
    time,
    color: '#fff',
    createdAt: '',
    updatedAt: '',
  }
}

function makeOps() {
  let seq = 0
  const create = jest.fn(async (note: Note) => makeNote(`new-${++seq}`, note.track, note.time))
  const remove = jest.fn(async () => true)
  const update = jest.fn(async () => true)
  return { create, remove, update } satisfies HistoryOps
}

describe('useEditorHistory', () => {
  it('undo of a create removes it; redo re-creates it', async () => {
    const ops = makeOps()
    const { result } = renderHook(() => useEditorHistory(ops))

    act(() => result.current.record({ kind: 'create', note: makeNote('a') }))
    expect(result.current.canUndo).toBe(true)

    await act(async () => result.current.undo())
    expect(ops.remove).toHaveBeenCalledWith('a')
    expect(result.current.canRedo).toBe(true)

    await act(async () => result.current.redo())
    expect(ops.create).toHaveBeenCalledTimes(1)
  })

  it('undo of an update applies the "before" patch', async () => {
    const ops = makeOps()
    const { result } = renderHook(() => useEditorHistory(ops))

    const before = { title: 'a', track: 1, time: 0, color: '#fff' }
    const after = { title: 'a', track: 4, time: 10, color: '#fff' }
    act(() => result.current.record({ kind: 'update', id: 'a', before, after }))

    await act(async () => result.current.undo())
    expect(ops.update).toHaveBeenCalledWith('a', before)

    await act(async () => result.current.redo())
    expect(ops.update).toHaveBeenCalledWith('a', after)
  })

  it('remaps ids so later entries follow a re-created note', async () => {
    const ops = makeOps()
    const { result } = renderHook(() => useEditorHistory(ops))

    act(() => result.current.record({ kind: 'create', note: makeNote('a') }))
    act(() =>
      result.current.record({
        kind: 'update',
        id: 'a',
        before: { title: 'a', track: 1, time: 0, color: '#fff' },
        after: { title: 'a', track: 2, time: 0, color: '#fff' },
      }),
    )

    await act(async () => result.current.undo()) // undo update
    await act(async () => result.current.undo()) // undo create -> remove('a')
    await act(async () => result.current.redo()) // redo create -> new id 'new-1'
    await act(async () => result.current.redo()) // redo update -> must target 'new-1'

    expect(ops.update).toHaveBeenLastCalledWith('new-1', { title: 'a', track: 2, time: 0, color: '#fff' })
  })

  it('record clears the redo stack', async () => {
    const ops = makeOps()
    const { result } = renderHook(() => useEditorHistory(ops))

    act(() => result.current.record({ kind: 'create', note: makeNote('a') }))
    await act(async () => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.record({ kind: 'create', note: makeNote('b') }))
    expect(result.current.canRedo).toBe(false)
  })
})
