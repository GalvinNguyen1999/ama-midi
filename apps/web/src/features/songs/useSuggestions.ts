import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { getSuggestionsApi, type SuggestedNote } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'
import { addNote } from '~/store/songSlice'
import type { Note } from '~/types/midi'

export function useSuggestions(songId: string | undefined, onCreated: (note: Note) => void) {
  const dispatch = useAppDispatch()
  const [suggestions, setSuggestions] = useState<SuggestedNote[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [acceptingAll, setAcceptingAll] = useState(false)

  useEffect(() => {
    setSuggestions([])
  }, [songId])

  const suggest = async () => {
    if (!songId) return
    setSuggesting(true)
    try {
      const res = await getSuggestionsApi(songId)
      setSuggestions(res)
      if (res.length === 0) toast.info('No suggestion available yet')
    } catch {
      /* interceptor surfaces the error */
    } finally {
      setSuggesting(false)
    }
  }

  const add = async (s: SuggestedNote) => {
    const res = await dispatch(
      addNote({ songId: songId ?? '', input: { title: 'Note', track: s.track, time: s.time, color: s.color } }),
    )
    if (addNote.fulfilled.match(res)) {
      onCreated(res.payload)
      return true
    }
    return false
  }

  const accept = async (s: SuggestedNote) => {
    if (!songId || acceptingAll) return
    if (await add(s)) {
      setSuggestions((prev) => prev.filter((x) => !(x.track === s.track && x.time === s.time)))
      toast.success('Note added')
    }
  }

  const acceptAll = async () => {
    if (!songId || suggestions.length === 0 || acceptingAll) return
    setAcceptingAll(true)
    try {
      let added = 0
      for (const s of suggestions) if (await add(s)) added += 1
      setSuggestions([])
      if (added > 0) toast.success(`Added ${added} suggested note${added > 1 ? 's' : ''}`)
    } finally {
      setAcceptingAll(false)
    }
  }

  const clear = () => setSuggestions([])

  return { suggestions, suggesting, acceptingAll, suggest, accept, acceptAll, clear }
}
