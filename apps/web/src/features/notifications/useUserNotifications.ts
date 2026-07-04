import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { ServerEvent } from '~/realtime/events'
import { useAppDispatch } from '~/store/hooks'
import { fetchInvites } from '~/store/invitesSlice'
import { applyCollaboratorRemoved, applyCollaboratorUpsert, applySongRemoved } from '~/store/songSlice'
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
        toast.info(`${by} invited you to “${event.title}”`)
        dispatch(fetchInvites())
      } else if (event.type === 'invite.responded') {
        const by = event.by ? event.by.split('@')[0] : 'Someone'
        if (event.accepted) {
          dispatch(
            applyCollaboratorUpsert({
              songId: event.songId,
              collaborator: {
                userId: event.userId,
                email: event.by,
                status: 'accepted',
                lastSeen: new Date().toISOString(),
              },
            }),
          )
        } else {
          dispatch(applyCollaboratorRemoved({ songId: event.songId, userId: event.userId }))
        }
        toast.info(`${by} ${event.accepted ? 'accepted' : 'declined'} “${event.title}”`)
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
