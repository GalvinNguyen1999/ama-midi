import { suggestNotes } from '~/utils/suggest'

const pattern = [
  { track: 1, time: 0, color: '#a' },
  { track: 4, time: 1, color: '#b' },
  { track: 1, time: 2, color: '#a' },
  { track: 4, time: 3, color: '#b' },
]

// rng that always picks the highest-weight transition (deterministic)
const topRng = () => 0.01

describe('suggestNotes', () => {
  it('returns a starter note for an empty sequence', () => {
    expect(suggestNotes([])).toEqual([{ track: 1, time: 0, color: expect.any(String) }])
  })

  it('continues a learned pattern as a phrase', () => {
    const phrase = suggestNotes(pattern, { count: 4, rng: topRng })
    expect(phrase).toHaveLength(4)
    expect(phrase.map((n) => n.track)).toEqual([1, 4, 1, 4]) // 1↔4 continues
    expect(phrase.map((n) => n.time)).toEqual([4, 5, 6, 7]) // step 1 each
  })

  it('respects the requested length', () => {
    expect(suggestNotes(pattern, { count: 2, rng: topRng })).toHaveLength(2)
  })

  it('never suggests a position that already exists', () => {
    const taken = new Set(pattern.map((n) => `${n.track}:${n.time}`))
    for (const s of suggestNotes(pattern, { count: 12 })) {
      expect(taken.has(`${s.track}:${s.time}`)).toBe(false)
    }
  })

  it('keeps suggestions within the timeline', () => {
    const near = [
      { track: 1, time: 298, color: '#a' },
      { track: 2, time: 299.5, color: '#a' },
    ]
    for (const s of suggestNotes(near, { count: 8 })) expect(s.time).toBeLessThanOrEqual(300)
  })
})
