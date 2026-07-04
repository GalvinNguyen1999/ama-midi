import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import type { Note } from '~/types/midi'

import { NOTE_RADIUS, timeToY, trackCenterX, xToTrack, yToTime } from '~/features/pianoRoll/config'

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

interface Params {
  notes: Note[]
  onCreateAt: (track: number, time: number) => void
  onSelectNote: (note: Note) => void
  onMoveNote: (note: Note, track: number, time: number) => void
  onDeleteMany?: (ids: string[]) => void
}

interface PianoRollInteraction {
  hover: Pos | null
  overNote: boolean
  drag: DragState | null
  selection: Set<string>
  marquee: Marquee | null
  cursor: string
  handlers: {
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
    onMouseMove: (e: MouseEvent<HTMLDivElement>) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onClick: (e: MouseEvent<HTMLDivElement>) => void
  }
}

export function usePianoRollInteraction({
  notes,
  onCreateAt,
  onSelectNote,
  onMoveNote,
  onDeleteMany,
}: Params): PianoRollInteraction {
  const [hover, setHover] = useState<Pos | null>(null)
  const [overNote, setOverNote] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<Marquee | null>(null)

  const suppressClick = useRef(false)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const deleteManyRef = useRef(onDeleteMany)
  deleteManyRef.current = onDeleteMany

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (selection.size === 0) return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      e.preventDefault()
      deleteManyRef.current?.([...selection])
      setSelection(new Set())
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection])

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
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
    const { x, y } = posFromEvent(e)
    const note = hitTest(x, y)

    if (note) {
      setSelection(new Set())
      setHover(null)
      setDrag({ note, track: note.track, time: note.time })
      return
    }

    marqueeStart.current = { x, y }
    setMarquee({ x0: x, y0: y, x1: x, y1: y })
  }

  const onMouseUp = () => {
    if (drag) {
      const changed = drag.track !== drag.note.track || drag.time !== drag.note.time
      if (changed) onMoveNote(drag.note, drag.track, drag.time)
      else onSelectNote(drag.note)
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
    marqueeStart.current = null
    setMarquee(null)
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
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

  const cursor = drag ? 'grabbing' : overNote ? 'grab' : 'crosshair'

  return {
    hover,
    overNote,
    drag,
    selection,
    marquee,
    cursor,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onClick },
  }
}
