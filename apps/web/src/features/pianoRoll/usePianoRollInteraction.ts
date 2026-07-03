import { useRef, useState } from 'react'
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

const HIT_R2 = (NOTE_RADIUS + 3) * (NOTE_RADIUS + 3)

interface Params {
  notes: Note[]
  onCreateAt: (track: number, time: number) => void
  onSelectNote: (note: Note) => void
  onMoveNote: (note: Note, track: number, time: number) => void
}

interface PianoRollInteraction {
  hover: Pos | null
  overNote: boolean
  drag: DragState | null
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
}: Params): PianoRollInteraction {
  const [hover, setHover] = useState<Pos | null>(null)
  const [overNote, setOverNote] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const suppressClick = useRef(false)

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

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y, pos } = posFromEvent(e)
    if (drag) {
      setDrag((d) => (d ? { ...d, track: pos.track, time: pos.time } : d))
      return
    }
    setHover(pos)
    setOverNote(hitTest(x, y) != null)
  }

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y } = posFromEvent(e)
    const note = hitTest(x, y)
    if (note) {
      setHover(null)
      setDrag({ note, track: note.track, time: note.time })
    }
  }

  const onMouseUp = () => {
    if (!drag) return
    const changed = drag.track !== drag.note.track || drag.time !== drag.note.time
    if (changed) onMoveNote(drag.note, drag.track, drag.time)
    else onSelectNote(drag.note)
    suppressClick.current = true
    setDrag(null)
  }

  const onMouseLeave = () => {
    setHover(null)
    setOverNote(false)
    setDrag(null)
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false
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
    cursor,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onClick },
  }
}
