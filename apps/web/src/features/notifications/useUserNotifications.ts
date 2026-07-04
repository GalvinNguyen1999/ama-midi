import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { ServerEvent } from '~/realtime/events'
import { useAppDispatch } from '~/store/hooks'
import { addNotification } from '~/store/notificationsSlice'
import { applySongRemoved, fetchSongs } from '~/store/songSlice'
import { WS_URL } from '~/utils/env'

export function useUserNotifications(userId: string | undefined) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

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
        dispatch(addNotification({ songId: event.songId, title: event.title, by: event.by }))
        toast.info(`${by} invited you to “${event.title}”`, {
          onClick: () => navigate(`/songs/${event.songId}`),
        })
        dispatch(fetchSongs())
      } else if (event.type === 'song.removed') {
        dispatch(applySongRemoved({ songId: event.songId }))
        if (pathRef.current === `/songs/${event.songId}`) navigate('/songs')
      } else if (event.type === 'access.revoked') {
        dispatch(applySongRemoved({ songId: event.songId }))
        toast.info(`You were removed from “${event.title}”`)
        if (pathRef.current === `/songs/${event.songId}`) navigate('/songs')
      }
    }

    return () => ws.close()
  }, [userId, dispatch, navigate])
}
