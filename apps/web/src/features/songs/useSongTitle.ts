import { useState } from 'react'
import { toast } from 'react-toastify'

import { useAppDispatch } from '~/store/hooks'
import { renameSong } from '~/store/songSlice'

interface Song {
  id: string
  title: string
}

export function useSongTitle(current: Song | null, isOwner: boolean) {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const start = () => {
    if (!current || !isOwner) return
    setDraft(current.title)
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const commit = async () => {
    setEditing(false)
    const title = draft.trim()
    if (!current || !title || title === current.title) return
    const res = await dispatch(renameSong({ id: current.id, title }))
    if (renameSong.fulfilled.match(res)) toast.success('Song renamed')
  }

  return { editing, draft, setDraft, start, cancel, commit }
}
