export const TRACK_MIN = 1
export const TRACK_MAX = 8
export const TRACK_COUNT = TRACK_MAX - TRACK_MIN + 1
export const TIME_MIN = 0
export const TIME_MAX = 300
export const TIME_STEP = 0.5

export const TRACK_WIDTH = 96
export const PX_PER_SECOND = 4
export const GRID_HEIGHT = TIME_MAX * PX_PER_SECOND
export const RULER_WIDTH = 52
export const NOTE_RADIUS = 9

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function timeToY(time: number): number {
  return time * PX_PER_SECOND
}

export function yToTime(y: number): number {
  const raw = clamp(y / PX_PER_SECOND, TIME_MIN, TIME_MAX)
  return Math.round(raw / TIME_STEP) * TIME_STEP
}

export function trackCenterX(track: number): number {
  return (track - TRACK_MIN) * TRACK_WIDTH + TRACK_WIDTH / 2
}

export function xToTrack(x: number): number {
  return clamp(Math.floor(x / TRACK_WIDTH) + TRACK_MIN, TRACK_MIN, TRACK_MAX)
}

export const DEFAULT_NOTE_COLOR = '#7c3aed'
