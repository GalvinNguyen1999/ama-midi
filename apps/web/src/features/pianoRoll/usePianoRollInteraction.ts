import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import type { Note } from '~/types/midi'

import {
  NOTE_RADIUS,
  TIME_MAX,
  TRACK_COUNT,
  TRACK_MIN,
  clamp,
  timeToY,
  trackCenterX,
  xToTrack,
  yToTime,
} from '~/features/pianoRoll/config'

export interface Pos {
  track: number
  time: number
}

export interface DragState extends Pos {
  note: Note
}

export interface Marquee {
  x0: number
  y0: number
  x1: number
  y1: number
}

const HIT_R2 = (NOTE_RADIUS + 3) * (NOTE_RADIUS + 3)
const MARQUEE_THRESHOLD = 4

const TRACK_MAX = TRACK_MIN + TRACK_COUNT - 1

interface Params {
  notes: Note[]
  onCreateAt: (track: number, time: number) => void
  onSelectNote: (note: Note) => void
  onMoveNote: (note: Note, track: number, time: number) => void
  onMoveMany?: (moves: { note: Note; track: number; time: number }[]) => void
  onDuplicate?: (notes: Note[]) => void
  onDeleteMany?: (ids: string[]) => void
  onSelectionChange?: (ids: string[]) => void
  readOnly?: boolean
}

export interface ContextMenu {
  note: Note
  x: number
  y: number
}

interface PianoRollInteraction {
  hover: Pos | null
  overNote: boolean
  drag: DragState | null
  selection: Set<string>
  marquee: Marquee | null
  cursor: string
  menu: ContextMenu | null
  closeMenu: () => void
  deleteSelected: () => void
  clearSelection: () => void
  handlers: {
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
    onMouseMove: (e: MouseEvent<HTMLDivElement>) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onClick: (e: MouseEvent<HTMLDivElement>) => void
    onContextMenu: (e: MouseEvent<HTMLDivElement>) => void
  }
}

export function usePianoRollInteraction({
  notes,
  onCreateAt,
  onSelectNote,
  onMoveNote,
  onMoveMany,
  onDuplicate,
  onDeleteMany,
  onSelectionChange,
  readOnly = false,
}: Params): PianoRollInteraction {
  const [hover, setHover] = useState<Pos | null>(null)
  const [overNote, setOverNote] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  const [menu, setMenu] = useState<ContextMenu | null>(null)

  const suppressClick = useRef(false)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const groupDrag = useRef<Note[] | null>(null)
  const deleteManyRef = useRef(onDeleteMany)
  deleteManyRef.current = onDeleteMany
  const moveManyRef = useRef(onMoveMany)
  moveManyRef.current = onMoveMany
  const duplicateRef = useRef(onDuplicate)
  duplicateRef.current = onDuplicate
  const selectionChangeRef = useRef(onSelectionChange)
  selectionChangeRef.current = onSelectionChange
  const notesRef = useRef(notes)
  notesRef.current = notes
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  const selectedNotes = () => notesRef.current.filter((n) => selectionRef.current.has(n.id))

  const clearSelection = () => setSelection(new Set())
  const closeMenu = () => setMenu(null)

  const deleteSelected = () => {
    if (selection.size === 0) return
    deleteManyRef.current?.([...selection])
    setSelection(new Set())
  }

  const nudge = (dTrack: number, dTime: number) => {
    const ids = selectionRef.current
    if (ids.size === 0) return
    const moves = notesRef.current
      .filter((n) => ids.has(n.id))
      .map((note) => ({
        note,
        track: clamp(note.track + dTrack, TRACK_MIN, TRACK_MAX),
        time: clamp(note.time + dTime, 0, TIME_MAX),
      }))
      .filter((m) => m.track !== m.note.track || m.time !== m.note.time)
    if (moves.length > 0) moveManyRef.current?.(moves)
  }

  const posFromEvent = (e: MouseEvent<HTMLDivElement>): { x: number; y: number; pos: Pos } => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y, pos: { track: xToTrack(x), time: yToTime(y) } }
  }

  const hitTest = (x: number, y: number): Note | null => {
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i]
      const dx = x - trackCenterX(n.track)
      const dy = y - timeToY(n.time)
      if (dx * dx + dy * dy <= HIT_R2) return n
    }
    return null
  }

  const notesInRect = (m: Marquee): string[] => {
    const minX = Math.min(m.x0, m.x1)
    const maxX = Math.max(m.x0, m.x1)
    const minY = Math.min(m.y0, m.y1)
    const maxY = Math.max(m.y0, m.y1)
    const ids: string[] = []
    for (const n of notes) {
      const cx = trackCenterX(n.track)
      const cy = timeToY(n.time)
      if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) ids.push(n.id)
    }
    return ids
  }

  useEffect(() => {
    if (readOnly) return

    const onKey = (e: KeyboardEvent) => {
      if (selectionRef.current.size === 0) return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteManyRef.current?.([...selectionRef.current])
        setSelection(new Set())
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateRef.current?.(selectedNotes())
        return
      }

      const nudges: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }
      const delta = nudges[e.key]
      if (delta) {
        e.preventDefault()
        nudge(delta[0], delta[1])
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [readOnly])

  useEffect(() => {
    selectionChangeRef.current?.([...selection])
  }, [selection])

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return
    const { x, y, pos } = posFromEvent(e)

    if (drag) {
      setDrag((d) => (d ? { ...d, track: pos.track, time: pos.time } : d))
      return
    }

    if (marqueeStart.current) {
      setMarquee({ x0: marqueeStart.current.x, y0: marqueeStart.current.y, x1: x, y1: y })
      return
    }

    setHover(pos)
    setOverNote(hitTest(x, y) != null)
  }

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return
    const { x, y } = posFromEvent(e)
    const note = hitTest(x, y)

    if (note) {
      if (selection.has(note.id) && selection.size > 1) {
        groupDrag.current = notes.filter((n) => selection.has(n.id))
      } else {
        setSelection(new Set())
        groupDrag.current = null
      }
      setHover(null)
      setDrag({ note, track: note.track, time: note.time })
      return
    }

    marqueeStart.current = { x, y }
    setMarquee({ x0: x, y0: y, x1: x, y1: y })
  }

  const onMouseUp = () => {
    if (drag) {
      const dTrack = drag.track - drag.note.track
      const dTime = drag.time - drag.note.time
      const changed = dTrack !== 0 || dTime !== 0
      const group = groupDrag.current
      groupDrag.current = null
      if (changed) {
        if (group && group.length > 1 && moveManyRef.current) {
          moveManyRef.current(
            group.map((note) => ({
              note,
              track: clamp(note.track + dTrack, TRACK_MIN, TRACK_MAX),
              time: clamp(note.time + dTime, 0, TIME_MAX),
            })),
          )
        } else {
          onMoveNote(drag.note, drag.track, drag.time)
        }
      } else {
        setSelection(new Set([drag.note.id]))
        onSelectNote(drag.note)
      }
      suppressClick.current = true
      setDrag(null)
      return
    }

    if (marqueeStart.current && marquee) {
      const moved =
        Math.abs(marquee.x1 - marquee.x0) > MARQUEE_THRESHOLD ||
        Math.abs(marquee.y1 - marquee.y0) > MARQUEE_THRESHOLD
      if (moved) {
        setSelection(new Set(notesInRect(marquee)))
        suppressClick.current = true
      }
      marqueeStart.current = null
      setMarquee(null)
    }
  }

  const onMouseLeave = () => {
    setHover(null)
    setOverNote(false)
    setDrag(null)
    groupDrag.current = null
    marqueeStart.current = null
    setMarquee(null)
  }

  const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return
    const { x, y } = posFromEvent(e)
    const note = hitTest(x, y)
    if (!note) return
    e.preventDefault()
    if (!selection.has(note.id)) setSelection(new Set())
    setMenu({ note, x: e.clientX, y: e.clientY })
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (selection.size > 0) {
      setSelection(new Set())
      return
    }
    const { pos } = posFromEvent(e)
    onCreateAt(pos.track, pos.time)
  }

  const cursor = readOnly ? 'default' : drag ? 'grabbing' : overNote ? 'grab' : 'crosshair'

  return {
    hover,
    overNote,
    drag,
    selection,
    marquee,
    cursor,
    menu,
    closeMenu,
    deleteSelected,
    clearSelection,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onClick, onContextMenu },
  }
}
