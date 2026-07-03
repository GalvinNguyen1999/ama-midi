import { useCallback, useEffect, useRef } from 'react'

import { PX_PER_SECOND, TIME_MAX } from '~/features/pianoRoll/config'
import { useAppDispatch } from '~/store/hooks'
import { CHUNK_SECONDS, loadNotes } from '~/store/songSlice'

const TOTAL_CHUNKS = Math.ceil(TIME_MAX / CHUNK_SECONDS)

interface WindowedNotes {
  scrollRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
  reload: () => void
}

export function useWindowedNotes(songId: string | undefined, currentId: string | undefined): WindowedNotes {
  const dispatch = useAppDispatch()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const requestedRef = useRef<Set<number>>(new Set())
  const rafPendingRef = useRef(false)

  const loadVisible = useCallback(() => {
    const el = scrollRef.current
    if (!el || !songId) return
    const top = el.scrollTop
    const bottom = top + el.clientHeight
    const fromChunk = Math.max(0, Math.floor(top / PX_PER_SECOND / CHUNK_SECONDS) - 1)
    const toChunk = Math.min(TOTAL_CHUNKS - 1, Math.floor(bottom / PX_PER_SECOND / CHUNK_SECONDS) + 1)
    for (let c = fromChunk; c <= toChunk; c++) {
      if (requestedRef.current.has(c)) continue
      requestedRef.current.add(c)
      dispatch(loadNotes({ songId, chunk: c }))
    }
  }, [dispatch, songId])

  useEffect(() => {
    if (!currentId) return
    requestedRef.current = new Set()
    scrollRef.current?.scrollTo({ top: 0 })
    const t = setTimeout(loadVisible, 0)
    return () => clearTimeout(t)
  }, [currentId, loadVisible])

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
    loadVisible()
  }

  return { scrollRef, onScroll, reload }
}
