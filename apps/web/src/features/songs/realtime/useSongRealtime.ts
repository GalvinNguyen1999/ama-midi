import { useCallback, useEffect, useRef, useState } from 'react'

import { applySongEvent } from '~/features/songs/realtime/applySongEvent'
import type { ServerEvent } from '~/realtime/events'
import { useAppDispatch } from '~/store/hooks'
import type { PresenceUser } from '~/types/midi'
import { WS_URL } from '~/utils/env'

export interface RemoteCursor {
  user: PresenceUser
  track: number | null
  time: number | null
  ts: number
}

interface RealtimeState {
  connected: boolean
  presence: PresenceUser[]
  cursors: RemoteCursor[]
  sendCursor: (track: number | null, time: number | null) => void
}

interface Options {
  onSongDeleted?: (actor?: string) => void
}

const CURSOR_TTL = 5000
const CURSOR_THROTTLE = 40

export function useSongRealtime(
  songId: string | undefined,
  user: PresenceUser | null,
  options: Options = {},
): RealtimeState {
  const dispatch = useAppDispatch()
  const [connected, setConnected] = useState(false)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})
  const wsRef = useRef<WebSocket | null>(null)
  const lastCursorSent = useRef(0)
  const selfEmail = useRef(user?.email)
  selfEmail.current = user?.email
  const onDeletedRef = useRef(options.onSongDeleted)
  onDeletedRef.current = options.onSongDeleted

  const sendCursor = useCallback(
    (track: number | null, time: number | null) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !user) return
      const now = Date.now()
      if (track !== null && now - lastCursorSent.current < CURSOR_THROTTLE) return
      lastCursorSent.current = now
      ws.send(JSON.stringify({ type: 'cursor', songId, user, track, time }))
    },
    [songId, user],
  )

  useEffect(() => {
    if (!songId) {
      setConnected(false)
      setPresence([])
      setCursors({})
      return
    }
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', songId, user }))
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (e: MessageEvent<string>) => {
      let event: ServerEvent
      try {
        event = JSON.parse(e.data) as ServerEvent
      } catch {
        return
      }

      if (event.type === 'presence') {
        setPresence(event.users)
        const present = new Set(event.users.map((u) => u.id))
        setCursors((prev) => {
          const next: Record<string, RemoteCursor> = {}
          for (const [id, c] of Object.entries(prev)) if (present.has(id)) next[id] = c
          return next
        })
        return
      }

      if (event.type === 'cursor') {
        setCursors((prev) => {
          if (event.track === null || event.time === null) {
            const next = { ...prev }
            delete next[event.user.id]
            return next
          }
          return {
            ...prev,
            [event.user.id]: { user: event.user, track: event.track, time: event.time, ts: Date.now() },
          }
        })
        return
      }

      applySongEvent(dispatch, event, selfEmail.current)

      if (event.type === 'song.deleted') onDeletedRef.current?.(event.actor)
    }

    const prune = window.setInterval(() => {
      const cutoff = Date.now() - CURSOR_TTL
      setCursors((prev) => {
        const next: Record<string, RemoteCursor> = {}
        let changed = false
        for (const [id, c] of Object.entries(prev)) {
          if (c.ts >= cutoff) next[id] = c
          else changed = true
        }
        return changed ? next : prev
      })
    }, 2000)

    return () => {
      window.clearInterval(prune)
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave', songId }))
      }
      ws.close()
      wsRef.current = null
    }
  }, [songId, dispatch, user])

  const cursorList = Object.values(cursors).filter((c) => c.user.id !== user?.id)

  return { connected, presence, cursors: cursorList, sendCursor }
}
