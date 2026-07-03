import { useEffect } from 'react'
import type { RefObject } from 'react'

import type { Note } from '~/types/midi'

import {
  GRID_HEIGHT,
  NOTE_RADIUS,
  TRACK_COUNT,
  TRACK_WIDTH,
  timeToY,
  trackCenterX,
} from '~/features/pianoRoll/config'

const GRID_WIDTH = TRACK_COUNT * TRACK_WIDTH

export function useNoteCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  notes: Note[],
  dragId: string | undefined,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = GRID_WIDTH * dpr
    canvas.height = GRID_HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'

    for (const note of notes) {
      if (note.id === dragId) continue
      ctx.beginPath()
      ctx.arc(trackCenterX(note.track), timeToY(note.time), NOTE_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = note.color
      ctx.fill()
      ctx.stroke()
    }
  }, [canvasRef, notes, dragId])
}
