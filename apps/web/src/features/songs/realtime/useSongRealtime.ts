import { useEffect, useRef, useState } from 'react'

import { applySongEvent } from '~/features/songs/realtime/applySongEvent'
import type { ServerEvent } from '~/realtime/events'
import { useAppDispatch } from '~/store/hooks'
import type { PresenceUser } from '~/types/midi'
import { WS_URL } from '~/utils/env'

interface RealtimeState {
  connected: boolean
  presence: PresenceUser[]
}

interface Options {
  onSongDeleted?: (actor?: string) => void
}

export function useSongRealtime(
  songId: string | undefined,
  user: PresenceUser | null,
  options: Options = {},
): RealtimeState {
  const dispatch = useAppDispatch()
  const [connected, setConnected] = useState(false)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const selfEmail = useRef(user?.email)
  selfEmail.current = user?.email
  const onDeletedRef = useRef(options.onSongDeleted)
  onDeletedRef.current = options.onSongDeleted

  useEffect(() => {
    if (!songId) {
      setConnected(false)
      setPresence([])
      return
    }
    const ws = new WebSocket(WS_URL)

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
        return
      }

      applySongEvent(dispatch, event, selfEmail.current)

      if (event.type === 'song.deleted') onDeletedRef.current?.(event.actor)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave', songId }))
      }
      ws.close()
    }
  }, [songId, dispatch, user])

  return { connected, presence }
}
