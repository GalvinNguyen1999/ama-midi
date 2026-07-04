import { Midi } from '@tonejs/midi'

import { clamp } from '~/features/pianoRoll/config'
import type { Note } from '~/types/midi'

// Each of the 8 tracks maps to a fixed pitch (mirrors the playback scale).
const TRACK_MIDI = [60, 62, 64, 67, 69, 72, 74, 76]
const NOTE_DURATION = 0.28
const NOTE_VELOCITY = 0.7

export function notesToMidi(notes: Note[], bpm: number): Uint8Array {
  const midi = new Midi()
  midi.header.setTempo(bpm || 120)
  const track = midi.addTrack()

  for (const note of notes) {
    track.addNote({
      midi: TRACK_MIDI[clamp(note.track - 1, 0, TRACK_MIDI.length - 1)],
      time: note.time,
      duration: NOTE_DURATION,
      velocity: NOTE_VELOCITY,
    })
  }

  return midi.toArray()
}
