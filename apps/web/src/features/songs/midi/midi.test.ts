import { Midi } from '@tonejs/midi'

import { notesToMidi } from '~/features/songs/midi/midi'
import type { Note } from '~/types/midi'

function note(track: number, time: number): Note {
  return {
    id: `${track}-${time}`,
    songId: 's1',
    title: 't',
    description: null,
    track,
    time,
    color: '#fff',
    createdAt: '',
    updatedAt: '',
  }
}

describe('notesToMidi', () => {
  it('encodes notes to a parseable MIDI file with the mapped pitches', () => {
    const bytes = notesToMidi([note(1, 0), note(4, 2)], 120)
    const midi = new Midi(bytes)
    const notes = midi.tracks.flatMap((t) => t.notes)

    expect(notes).toHaveLength(2)
    expect(notes.map((n) => n.midi).sort((a, b) => a - b)).toEqual([60, 67])
  })

  it('applies the given tempo', () => {
    const midi = new Midi(notesToMidi([note(1, 0)], 90))
    expect(Math.round(midi.header.tempos[0].bpm)).toBe(90)
  })

  it('produces an empty but valid file when there are no notes', () => {
    const midi = new Midi(notesToMidi([], 120))
    expect(midi.tracks.flatMap((t) => t.notes)).toHaveLength(0)
  })
})
