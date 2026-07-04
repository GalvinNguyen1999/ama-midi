import { act, renderHook } from '@testing-library/react'
import type { MouseEvent } from 'react'

import { timeToY, trackCenterX } from '~/features/pianoRoll/config'
import { usePianoRollInteraction } from '~/features/pianoRoll/usePianoRollInteraction'
import type { Note } from '~/types/midi'

const note: Note = {
  id: 'n1',
  songId: 's1',
  title: 'A',
  description: null,
  track: 3,
  time: 10,
  color: '#fff',
  createdAt: '',
  updatedAt: '',
}

// center pixel of the note above
const NX = trackCenterX(note.track)
const NY = timeToY(note.time)

function evt(x: number, y: number): MouseEvent<HTMLDivElement> {
  return {
    clientX: x,
    clientY: y,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
  } as unknown as MouseEvent<HTMLDivElement>
}

function setup(
  onCreateAt = jest.fn(),
  onSelectNote = jest.fn(),
  onMoveNote = jest.fn(),
  onDeleteMany = jest.fn(),
) {
  const view = renderHook(() =>
    usePianoRollInteraction({ notes: [note], onCreateAt, onSelectNote, onMoveNote, onDeleteMany }),
  )
  return { view, onCreateAt, onSelectNote, onMoveNote, onDeleteMany }
}

describe('usePianoRollInteraction', () => {
  it('creates a note when clicking empty grid space', () => {
    const { view, onCreateAt } = setup()
    act(() => view.result.current.handlers.onClick(evt(50, 8)))
    expect(onCreateAt).toHaveBeenCalledWith(1, 2)
  })

  it('shows a grab cursor when hovering a note, crosshair otherwise', () => {
    const { view } = setup()
    act(() => view.result.current.handlers.onMouseMove(evt(NX, NY)))
    expect(view.result.current.cursor).toBe('grab')

    act(() => view.result.current.handlers.onMouseMove(evt(5, 4)))
    expect(view.result.current.cursor).toBe('crosshair')
  })

  it('starts dragging on mousedown over a note (grabbing cursor)', () => {
    const { view } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX, NY)))
    expect(view.result.current.drag?.note.id).toBe('n1')
    expect(view.result.current.cursor).toBe('grabbing')
  })

  it('commits a move when dropped at a different position', () => {
    const { view, onMoveNote, onSelectNote } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX, NY)))
    act(() => view.result.current.handlers.onMouseMove(evt(NX, timeToY(20))))
    act(() => view.result.current.handlers.onMouseUp())
    expect(onMoveNote).toHaveBeenCalledWith(note, 3, 20)
    expect(onSelectNote).not.toHaveBeenCalled()
    expect(view.result.current.drag).toBeNull()
  })

  it('treats a drag that ends on the same cell as a select', () => {
    const { view, onSelectNote, onMoveNote } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX, NY)))
    act(() => view.result.current.handlers.onMouseUp())
    expect(onSelectNote).toHaveBeenCalledWith(note)
    expect(onMoveNote).not.toHaveBeenCalled()
  })

  it('suppresses the click that fires right after a drag', () => {
    const { view, onCreateAt } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX, NY)))
    act(() => view.result.current.handlers.onMouseUp())
    act(() => view.result.current.handlers.onClick(evt(50, 8)))
    expect(onCreateAt).not.toHaveBeenCalled()
  })

  it('marquee-selects notes inside the dragged rectangle', () => {
    const { view } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX - 20, NY - 20)))
    act(() => view.result.current.handlers.onMouseMove(evt(NX + 20, NY + 20)))
    act(() => view.result.current.handlers.onMouseUp())
    expect([...view.result.current.selection]).toEqual(['n1'])
  })

  it('deletes the selection when Delete is pressed', () => {
    const { view, onDeleteMany } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX - 20, NY - 20)))
    act(() => view.result.current.handlers.onMouseMove(evt(NX + 20, NY + 20)))
    act(() => view.result.current.handlers.onMouseUp())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
    })
    expect(onDeleteMany).toHaveBeenCalledWith(['n1'])
    expect(view.result.current.selection.size).toBe(0)
  })

  it('resets hover and drag on mouse leave', () => {
    const { view } = setup()
    act(() => view.result.current.handlers.onMouseDown(evt(NX, NY)))
    act(() => view.result.current.handlers.onMouseLeave())
    expect(view.result.current.drag).toBeNull()
    expect(view.result.current.hover).toBeNull()
    expect(view.result.current.cursor).toBe('crosshair')
  })
})
