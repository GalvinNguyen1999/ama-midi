import { useEffect } from 'react'

export function useUndoRedoShortcuts(undo: () => void, redo: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      e.preventDefault()
      if (key === 'y' || e.shiftKey) redo()
      else undo()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])
}
