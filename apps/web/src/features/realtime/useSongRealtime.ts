import { useEffect, useState } from 'react'

import { useAppDispatch } from '~/store/hooks'
import { applyNoteRemove, applyNoteUpsert } from '~/store/songSlice'
import type { Note } from '~/types/midi'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000'

type ServerEvent =
  | { type: 'note.created'; songId: string; note: Note }
  | { type: 'note.updated'; songId: string; note: Note }
  | { type: 'note.deleted'; songId: string; noteId: string }

export function useSongRealtime(songId: string | undefined): boolean {
  const dispatch = useAppDispatch()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!songId) {
      setConnected(false)
      return
    }
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', songId }))
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
      if (event.type === 'note.created' || event.type === 'note.updated') {
        dispatch(applyNoteUpsert(event.note))
      } else if (event.type === 'note.deleted') {
        dispatch(applyNoteRemove({ songId: event.songId, noteId: event.noteId }))
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave', songId }))
      }
      ws.close()
    }
  }, [songId, dispatch])

  return connected
}
