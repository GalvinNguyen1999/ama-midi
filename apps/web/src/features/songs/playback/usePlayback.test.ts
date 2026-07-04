import { act, renderHook } from '@testing-library/react'

import { usePlayback } from '~/features/songs/playback/usePlayback'
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

  it('applies the selected timbre to each oscillator', () => {
    const { result } = renderHook(() => usePlayback([makeNote('a', 1, 0)], { timbre: 'square' }))
    act(() => result.current.play())
    expect(audio.osc.type).toBe('square')
  })

  it('reschedules the cycle instead of stopping when loop is on', () => {
    let now = 0
    jest.spyOn(performance, 'now').mockImplementation(() => now)
    const rafCbs: FrameRequestCallback[] = []
    ;(globalThis.requestAnimationFrame as jest.Mock).mockImplementation((cb: FrameRequestCallback) => {
      rafCbs.push(cb)
      return rafCbs.length
    })

    const { result } = renderHook(() => usePlayback([makeNote('a', 1, 0)], { loop: true }))
    act(() => result.current.play())
    expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(1)

    now = 10_000
    act(() => rafCbs[rafCbs.length - 1](0))

    expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(2)
    expect(result.current.playing).toBe(true)
  })
})
