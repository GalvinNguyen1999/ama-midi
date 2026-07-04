import { Midi } from '@tonejs/midi'

import { midiToNotes } from '~/utils/midi'

const TRACK_MIDI = [60, 62, 64, 67, 69, 72, 74, 76]

function buildMidi(notes: { midi: number; time: number }[]): Uint8Array {
  const midi = new Midi()
  const track = midi.addTrack()
  for (const n of notes) track.addNote({ midi: n.midi, time: n.time, duration: 0.3, velocity: 0.7 })
  return midi.toArray()
}

describe('midiToNotes', () => {
  it('maps each pitch to its exact track and keeps the time', () => {
    const bytes = buildMidi([
      { midi: TRACK_MIDI[0], time: 0 },
      { midi: TRACK_MIDI[3], time: 2 },
    ])
    const notes = midiToNotes(bytes)
    expect(notes).toContainEqual({ track: 1, time: 0 })
    expect(notes).toContainEqual({ track: 4, time: 2 })
  })

  it('maps an off-scale pitch to the nearest track', () => {
    // 61 (C#4) is closest to 60 (track 1)
    const notes = midiToNotes(buildMidi([{ midi: 61, time: 0 }]))
    expect(notes[0].track).toBe(1)
  })

  it('clamps time beyond 300s into range', () => {
    const notes = midiToNotes(buildMidi([{ midi: 60, time: 999 }]))
    expect(notes[0].time).toBeLessThanOrEqual(300)
  })

  it('dedupes notes landing on the same track and time', () => {
    const notes = midiToNotes(buildMidi([{ midi: 60, time: 1 }, { midi: 61, time: 1 }]))
    expect(notes).toHaveLength(1)
  })
})
