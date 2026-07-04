import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import { useAppDispatch } from '~/store/hooks'
import {
  applyNoteRemove,
  applyNoteUpsert,
  applySongRemoved,
  applySongUpdate,
} from '~/store/songSlice'
import type { Note, PresenceUser } from '~/types/midi'
import { WS_URL } from '~/utils/env'

type ServerEvent =
  | { type: 'note.created'; songId: string; note: Note; actor?: string }
  | { type: 'note.updated'; songId: string; note: Note; actor?: string }
  | { type: 'note.deleted'; songId: string; noteId: string; actor?: string }
  | {
      type: 'song.updated'
      songId: string
      title: string
      shareMode: 'edit' | 'view'
      version: number
      change: 'title' | 'share'
      actor?: string
    }
  | { type: 'song.deleted'; songId: string; actor?: string }
  | { type: 'presence'; songId: string; users: PresenceUser[] }

interface RealtimeState {
  connected: boolean
  presence: PresenceUser[]
}

const actorName = (actor?: string) => (actor ? actor.split('@')[0] : 'Someone')

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

      const fromOther = event.actor && event.actor !== selfEmail.current

      if (event.type === 'note.created' || event.type === 'note.updated') {
        dispatch(applyNoteUpsert(event.note))
        if (fromOther) {
          const verb = event.type === 'note.created' ? 'added' : 'edited'
          toast.info(`${actorName(event.actor)} ${verb} a note`)
        }
      } else if (event.type === 'note.deleted') {
        dispatch(applyNoteRemove({ songId: event.songId, noteId: event.noteId }))
        if (fromOther) toast.info(`${actorName(event.actor)} removed a note`)
      } else if (event.type === 'song.updated') {
        dispatch(
          applySongUpdate({
            id: event.songId,
            title: event.title,
            shareMode: event.shareMode,
            version: event.version,
          }),
        )
        if (fromOther) {
          const what = event.change === 'title' ? 'renamed the song' : 'changed sharing'
          toast.info(`${actorName(event.actor)} ${what}`)
        }
      } else if (event.type === 'song.deleted') {
        dispatch(applySongRemoved({ songId: event.songId }))
        onDeletedRef.current?.(event.actor)
      }
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
