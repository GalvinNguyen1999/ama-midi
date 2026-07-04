import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { ServerEvent } from '~/realtime/events'
import { useAppDispatch } from '~/store/hooks'
import { fetchSongs } from '~/store/songSlice'
import { WS_URL } from '~/utils/env'

export function useUserNotifications(userId: string | undefined) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (!userId) return
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', userId }))

    ws.onmessage = (e: MessageEvent<string>) => {
      let event: ServerEvent
      try {
        event = JSON.parse(e.data) as ServerEvent
      } catch {
        return
      }

      if (event.type === 'invited') {
        const by = event.by ? event.by.split('@')[0] : 'Someone'
        toast.info(`${by} invited you to “${event.title}”`, {
          onClick: () => navigate(`/songs/${event.songId}`),
        })
        dispatch(fetchSongs())
      }
    }

    return () => ws.close()
  }, [userId, dispatch, navigate])
}
