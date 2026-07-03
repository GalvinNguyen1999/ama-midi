import { act, renderHook } from '@testing-library/react'

import { usePlayback } from '~/features/songs/usePlayback'
import type { Note } from '~/types/midi'

function makeNote(id: string, track: number, time: number): Note {
  return {
    id,
    songId: 's1',
    title: id,
    description: null,
    track,
    time,
    color: '#fff',
    createdAt: '',
    updatedAt: '',
  }
}

function makeAudioMock() {
  const gain = {
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  }
  const osc = { type: '', frequency: { value: 0 }, connect: jest.fn(), start: jest.fn(), stop: jest.fn() }
  const ctx = {
    currentTime: 0,
    destination: {},
    createOscillator: jest.fn(() => osc),
    createGain: jest.fn(() => gain),
    close: jest.fn().mockResolvedValue(undefined),
  }
  return { ctx, osc }
}

describe('usePlayback', () => {
  let audio: ReturnType<typeof makeAudioMock>

  beforeEach(() => {
    audio = makeAudioMock()
    globalThis.AudioContext = jest.fn(() => audio.ctx) as unknown as typeof AudioContext
    jest.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1)
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  it('does nothing when there are no notes', () => {
    const { result } = renderHook(() => usePlayback([]))
    act(() => result.current.play())
    expect(globalThis.AudioContext).not.toHaveBeenCalled()
    expect(result.current.playing).toBe(false)
  })

  it('schedules one tone per note and marks playing', () => {
    const notes = [makeNote('a', 1, 0), makeNote('b', 4, 2)]
    const { result } = renderHook(() => usePlayback(notes))
    act(() => result.current.play())
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1)
    expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(2)
    expect(result.current.playing).toBe(true)
  })

  it('stop() closes the audio context and resets state', () => {
    const { result } = renderHook(() => usePlayback([makeNote('a', 1, 0)]))
    act(() => result.current.play())
    act(() => result.current.stop())
    expect(audio.ctx.close).toHaveBeenCalled()
    expect(result.current.playing).toBe(false)
    expect(result.current.playhead).toBe(0)
  })
})
