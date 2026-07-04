import { useCallback, useLayoutEffect, useRef } from 'react'

import { PX_PER_SECOND, TIME_MAX } from '~/features/pianoRoll/config'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { CHUNK_SECONDS, loadNotes } from '~/store/songSlice'

const TOTAL_CHUNKS = Math.ceil(TIME_MAX / CHUNK_SECONDS)
const MAX_CONCURRENT = 3

interface WindowedNotes {
  scrollRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
  reload: () => void
}

export function useWindowedNotes(songId: string | undefined): WindowedNotes {
  const dispatch = useAppDispatch()
  const generation = useAppSelector((s) => s.song.loadGeneration)
  const loadedChunks = useAppSelector((s) => s.song.loadedChunks)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const requestedRef = useRef<Set<number>>(new Set())
  const queueRef = useRef<number[]>([])
  const activeRef = useRef(0)
  const rafPendingRef = useRef(false)
  const loadedRef = useRef(loadedChunks)
  loadedRef.current = loadedChunks

  const pump = useCallback(() => {
    if (!songId) return
    while (activeRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const chunk = queueRef.current.shift() as number
      activeRef.current += 1
      Promise.resolve(dispatch(loadNotes({ songId, chunk }))).finally(() => {
        activeRef.current = Math.max(0, activeRef.current - 1)
        pump()
      })
    }
  }, [dispatch, songId])

  const loadVisible = useCallback(() => {
    const el = scrollRef.current
    if (!el || !songId) return

    const anchor = el.scrollTop / PX_PER_SECOND / CHUNK_SECONDS
    const fromChunk = Math.max(0, Math.floor(el.scrollTop / PX_PER_SECOND / CHUNK_SECONDS) - 1)
    const toChunk = Math.min(
      TOTAL_CHUNKS - 1,
      Math.floor((el.scrollTop + el.clientHeight) / PX_PER_SECOND / CHUNK_SECONDS) + 1,
    )

    for (let c = fromChunk; c <= toChunk; c++) {
      if (requestedRef.current.has(c) || loadedRef.current.includes(c)) continue
      requestedRef.current.add(c)
      queueRef.current.push(c)
    }

    queueRef.current.sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))
    pump()
  }, [pump, songId])

  useLayoutEffect(() => {
    if (!songId) return
    requestedRef.current = new Set()
    queueRef.current = []
    activeRef.current = 0
    scrollRef.current?.scrollTo({ top: 0 })
    const t = setTimeout(loadVisible, 0)
    return () => clearTimeout(t)
  }, [songId, generation, loadVisible])

  const onScroll = () => {
    if (rafPendingRef.current) return
    rafPendingRef.current = true
    requestAnimationFrame(() => {
      rafPendingRef.current = false
      loadVisible()
    })
  }

  const reload = () => {
    requestedRef.current = new Set()
    queueRef.current = []
    activeRef.current = 0
    loadVisible()
  }

  return { scrollRef, onScroll, reload }
}
