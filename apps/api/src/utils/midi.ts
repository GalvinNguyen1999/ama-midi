import { Midi } from '@tonejs/midi'

import { TIME_MAX, TIME_MIN } from '~/config/constants'

// Each of the 8 tracks maps to a fixed pitch (mirrors the client playback scale).
const TRACK_MIDI = [60, 62, 64, 67, 69, 72, 74, 76]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function nearestTrack(midiNote: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < TRACK_MIDI.length; i++) {
    const dist = Math.abs(TRACK_MIDI[i] - midiNote)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best + 1
}

export function midiToNotes(data: ArrayLike<number> | ArrayBuffer): { track: number; time: number }[] {
  const midi = new Midi(data)
  const seen = new Set<string>()
  const notes: { track: number; time: number }[] = []

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      const time = Math.round(clamp(note.time, TIME_MIN, TIME_MAX) * 1000) / 1000
      const trackIndex = nearestTrack(note.midi)
      const key = `${trackIndex}:${time}`
      if (seen.has(key)) continue
      seen.add(key)
      notes.push({ track: trackIndex, time })
    }
  }

  return notes
}
