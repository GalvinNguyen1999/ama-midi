import { useCallback, useRef, useState } from 'react'

import type { Note } from '~/types/midi'

export interface NotePatch {
  title: string
  description?: string
  track: number
  time: number
  color: string
}

export type HistoryEntry =
  | { kind: 'create'; note: Note }
  | { kind: 'delete'; note: Note }
  | { kind: 'update'; id: string; before: NotePatch; after: NotePatch }

export interface HistoryOps {
  create: (note: Note) => Promise<Note | null>
  remove: (id: string) => Promise<boolean>
  update: (id: string, patch: NotePatch) => Promise<boolean>
}

export interface EditorHistory {
  record: (entry: HistoryEntry) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
  reset: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useEditorHistory(ops: HistoryOps): EditorHistory {
  const opsRef = useRef(ops)
  opsRef.current = ops

  const pastRef = useRef<HistoryEntry[]>([])
  const futureRef = useRef<HistoryEntry[]>([])
  const busyRef = useRef(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const sync = useCallback(() => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const remap = (oldId: string, newId: string) => {
    for (const stack of [pastRef.current, futureRef.current]) {
      for (const entry of stack) {
        if (entry.kind === 'update') {
          if (entry.id === oldId) entry.id = newId
        } else if (entry.note.id === oldId) {
          entry.note = { ...entry.note, id: newId }
        }
      }
    }
  }

  const record = useCallback(
    (entry: HistoryEntry) => {
      pastRef.current.push(entry)
      futureRef.current = []
      sync()
    },
    [sync],
  )

  const undo = useCallback(async () => {
    if (busyRef.current) return
    const entry = pastRef.current.pop()
    if (!entry) return

    busyRef.current = true
    try {
      if (entry.kind === 'create') {
        await opsRef.current.remove(entry.note.id)
      } else if (entry.kind === 'delete') {
        const created = await opsRef.current.create(entry.note)
        if (created) remap(entry.note.id, created.id)
      } else {
        await opsRef.current.update(entry.id, entry.before)
      }
      futureRef.current.push(entry)
    } finally {
      busyRef.current = false
      sync()
    }
  }, [sync])

  const redo = useCallback(async () => {
    if (busyRef.current) return
    const entry = futureRef.current.pop()
    if (!entry) return

    busyRef.current = true
    try {
      if (entry.kind === 'create') {
        const created = await opsRef.current.create(entry.note)
        if (created) remap(entry.note.id, created.id)
      } else if (entry.kind === 'delete') {
        await opsRef.current.remove(entry.note.id)
      } else {
        await opsRef.current.update(entry.id, entry.after)
      }
      pastRef.current.push(entry)
    } finally {
      busyRef.current = false
      sync()
    }
  }, [sync])

  const reset = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    sync()
  }, [sync])

  return { record, undo, redo, reset, canUndo, canRedo }
}
