import { toast } from 'react-toastify'

import type { ServerEvent } from '~/realtime/events'
import type { AppDispatch } from '~/store'
import {
  applyNoteRemove,
  applyNoteUpsert,
  applySongRemoved,
  applySongUpdate,
} from '~/store/songSlice'

const actorName = (actor?: string) => (actor ? actor.split('@')[0] : 'Someone')

export function applySongEvent(dispatch: AppDispatch, event: ServerEvent, selfEmail?: string) {
  const fromOther = 'actor' in event && !!event.actor && event.actor !== selfEmail

  switch (event.type) {
    case 'note.created':
    case 'note.updated':
      dispatch(applyNoteUpsert(event.note))
      if (fromOther) {
        const verb = event.type === 'note.created' ? 'added' : 'edited'
        toast.info(`${actorName(event.actor)} ${verb} a note`)
      }
      break

    case 'note.deleted':
      dispatch(applyNoteRemove({ songId: event.songId, noteId: event.noteId }))
      if (fromOther) toast.info(`${actorName(event.actor)} removed a note`)
      break

    case 'song.updated':
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
      break

    case 'song.deleted':
      dispatch(applySongRemoved({ songId: event.songId }))
      break
  }
}
