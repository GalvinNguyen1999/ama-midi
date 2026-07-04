import { useCallback, useEffect, useRef, useState } from 'react'

import { TIME_MAX, TRACK_MIN, clamp } from '~/features/pianoRoll/config'
import type { Note } from '~/types/midi'

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]

export function trackFrequency(track: number): number {
  return SCALE[clamp(track - TRACK_MIN, 0, SCALE.length - 1)]
}

export type Timbre = 'sine' | 'triangle' | 'square' | 'sawtooth'

function scheduleTone(ctx: AudioContext, freq: number, at: number, type: Timbre, dur = 0.28) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.22, at + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)

  osc.start(at)
  osc.stop(at + dur + 0.02)
}

interface PlaybackOptions {
  timbre?: Timbre
  loop?: boolean
}

interface PlaybackState {
  playing: boolean
  playhead: number
  play: (from?: number) => void
  stop: () => void
}

export function usePlayback(notes: Note[], options: PlaybackOptions = {}): PlaybackState {
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const endRef = useRef(0)
  const offsetRef = useRef(0)
  const notesRef = useRef(notes)
  notesRef.current = notes
  const optionsRef = useRef(options)
  optionsRef.current = options

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
    setPlaying(false)
    setPlayhead(0)
  }, [])

  const play = useCallback(
    (from = 0) => {
      const current = notesRef.current
      if (current.length === 0) return

      ctxRef.current?.close().catch(() => undefined)
      const ctx = new AudioContext()
      ctxRef.current = ctx
      offsetRef.current = typeof from === 'number' && Number.isFinite(from) ? Math.max(0, from) : 0

      const scheduleCycle = (at0: number) => {
        const timbre = optionsRef.current.timbre ?? 'sine'
        const offset = offsetRef.current
        let last = 0
        for (const n of current) {
          if (n.time >= offset) scheduleTone(ctx, trackFrequency(n.track), at0 + (n.time - offset), timbre)
          if (n.time > last) last = n.time
        }
        return last
      }

      const last = scheduleCycle(ctx.currentTime + 0.08)
      startRef.current = performance.now()
      endRef.current = Math.min(last + 0.6, TIME_MAX + 0.6)
      setPlaying(true)
      setPlayhead(offsetRef.current)

      const tick = () => {
        const elapsed = offsetRef.current + (performance.now() - startRef.current) / 1000
        if (elapsed >= endRef.current) {
          if (optionsRef.current.loop) {
            scheduleCycle(ctx.currentTime + 0.05)
            startRef.current = performance.now()
            setPlayhead(offsetRef.current)
            rafRef.current = requestAnimationFrame(tick)
            return
          }
          stop()
          return
        }
        setPlayhead(elapsed)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [stop],
  )

  useEffect(() => stop, [stop])

  return { playing, playhead, play, stop }
}
