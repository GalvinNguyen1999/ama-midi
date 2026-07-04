import { DEFAULT_NOTE_COLOR, TIME_MAX, TRACK_MAX } from '~/config/constants'

export interface SuggestNote {
  track: number
  time: number
  color: string
}

interface Options {
  count?: number
  rng?: () => number
}

function median(nums: number[]): number {
  if (nums.length === 0) return 1
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

function sampleWeighted(dist: Map<number, number>, rng: () => number): number | null {
  const entries = [...dist.entries()]

  if (entries.length === 0) return null
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  let r = rng() * total
  for (const [track, count] of entries) {
    r -= count
    if (r <= 0) return track
  }
  return entries[entries.length - 1][0]
}

function topColor(colors: Map<string, number> | undefined, fallback: string): string {
  if (!colors) return fallback
  return [...colors.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Continues the sequence with a short phrase using a first-order Markov model:
 * it learns track→track transition frequencies and the typical time gap, then
 * walks the chain forward, sampling from the distribution so each call yields a
 * fresh variant. Returns up to `count` notes.
 */
export function suggestNotes(notes: SuggestNote[], options: Options = {}): SuggestNote[] {
  const count = Math.min(Math.max(options.count ?? 8, 1), 32)
  const rng = options.rng ?? Math.random

  if (notes.length === 0) {
    return [{ track: 1, time: 0, color: DEFAULT_NOTE_COLOR }]
  }

  const sorted = [...notes].sort((a, b) => a.time - b.time)

  const transitions = new Map<number, Map<number, number>>()
  const colorByTrack = new Map<number, Map<string, number>>()
  const deltas: number[] = []

  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i]
    const colors = colorByTrack.get(note.track) ?? new Map<string, number>()
    colors.set(note.color, (colors.get(note.color) ?? 0) + 1)
    colorByTrack.set(note.track, colors)

    if (i > 0) {
      const prev = sorted[i - 1]
      const next = transitions.get(prev.track) ?? new Map<number, number>()
      next.set(note.track, (next.get(note.track) ?? 0) + 1)
      transitions.set(prev.track, next)
      if (note.time > prev.time) deltas.push(note.time - prev.time)
    }
  }

  const step = Math.max(0.1, round3(median(deltas)))
  const taken = new Set(notes.map((n) => `${n.track}:${n.time}`))
  const phrase: SuggestNote[] = []
  let current = sorted[sorted.length - 1]

  for (let i = 0; i < count; i++) {
    const time = round3(current.time + step)
    if (time > TIME_MAX) break

    let track: number | null = null
    for (let attempt = 0; attempt < TRACK_MAX; attempt++) {
      const candidate =
        sampleWeighted(transitions.get(current.track) ?? new Map(), rng) ??
        1 + Math.floor(rng() * TRACK_MAX)
      if (!taken.has(`${candidate}:${time}`)) {
        track = candidate
        break
      }
    }
    if (track == null) break

    const color = topColor(colorByTrack.get(track), current.color || DEFAULT_NOTE_COLOR)
    const note = { track, time, color }
    phrase.push(note)
    taken.add(`${track}:${time}`)
    current = note
  }

  return phrase
}
