import { renderHook } from '@testing-library/react'
import type { RefObject } from 'react'

import { useNoteCanvas } from '~/features/pianoRoll/useNoteCanvas'
import type { Note } from '~/types/midi'

function makeNote(id: string): Note {
  return {
    id,
    songId: 's1',
    title: id,
    description: null,
    track: 1,
    time: 1,
    color: '#fff',
    createdAt: '',
    updatedAt: '',
  }
}

function fakeCanvas() {
  const ctx = {
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
  }
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement
  return { canvas, ctx }
}

describe('useNoteCanvas', () => {
  it('draws one arc per note', () => {
    const { canvas, ctx } = fakeCanvas()
    const ref = { current: canvas } as RefObject<HTMLCanvasElement | null>
    renderHook(() => useNoteCanvas(ref, [makeNote('a'), makeNote('b'), makeNote('c')], undefined))
    expect(ctx.arc).toHaveBeenCalledTimes(3)
    expect(ctx.clearRect).toHaveBeenCalled()
  })

  it('skips the note currently being dragged', () => {
    const { canvas, ctx } = fakeCanvas()
    const ref = { current: canvas } as RefObject<HTMLCanvasElement | null>
    renderHook(() => useNoteCanvas(ref, [makeNote('a'), makeNote('b')], 'a'))
    expect(ctx.arc).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the canvas ref is empty', () => {
    const ref = { current: null } as RefObject<HTMLCanvasElement | null>
    expect(() => renderHook(() => useNoteCanvas(ref, [makeNote('a')], undefined))).not.toThrow()
  })
})
