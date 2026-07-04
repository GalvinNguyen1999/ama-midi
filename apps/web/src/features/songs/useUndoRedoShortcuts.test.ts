import { renderHook } from '@testing-library/react'

import { useUndoRedoShortcuts } from './useUndoRedoShortcuts'

function press(init: KeyboardEventInit, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  ;(target ?? window).dispatchEvent(event)
}

describe('useUndoRedoShortcuts', () => {
  it('runs undo on Cmd/Ctrl+Z', () => {
    const undo = jest.fn()
    const redo = jest.fn()
    renderHook(() => useUndoRedoShortcuts(undo, redo))
    press({ key: 'z', metaKey: true })
    expect(undo).toHaveBeenCalled()
    expect(redo).not.toHaveBeenCalled()
  })

  it('runs redo on Shift+Cmd+Z and on Ctrl+Y', () => {
    const undo = jest.fn()
    const redo = jest.fn()
    renderHook(() => useUndoRedoShortcuts(undo, redo))
    press({ key: 'z', metaKey: true, shiftKey: true })
    press({ key: 'y', ctrlKey: true })
    expect(redo).toHaveBeenCalledTimes(2)
    expect(undo).not.toHaveBeenCalled()
  })

  it('ignores keys without a modifier', () => {
    const undo = jest.fn()
    renderHook(() => useUndoRedoShortcuts(undo, jest.fn()))
    press({ key: 'z' })
    expect(undo).not.toHaveBeenCalled()
  })

  it('ignores shortcuts fired from a text field', () => {
    const undo = jest.fn()
    renderHook(() => useUndoRedoShortcuts(undo, jest.fn()))
    const input = document.createElement('input')
    document.body.appendChild(input)
    press({ key: 'z', metaKey: true }, input)
    expect(undo).not.toHaveBeenCalled()
    input.remove()
  })

  it('removes the listener on unmount', () => {
    const undo = jest.fn()
    const { unmount } = renderHook(() => useUndoRedoShortcuts(undo, jest.fn()))
    unmount()
    press({ key: 'z', metaKey: true })
    expect(undo).not.toHaveBeenCalled()
  })
})
