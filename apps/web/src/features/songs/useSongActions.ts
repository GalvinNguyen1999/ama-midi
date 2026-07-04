import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { toast } from 'react-toastify'

import { seedNotesApi } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'
import { openSong, removeSong } from '~/store/songSlice'
import type { SongWithNotes } from '~/types/midi'

interface Args {
  current: SongWithNotes | null
  reload: () => void
  navigate: NavigateFunction
}

export function useSongActions({ current, reload, navigate }: Args) {
  const dispatch = useAppDispatch()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const openDelete = () => setDeleteOpen(true)
  const closeDelete = () => setDeleteOpen(false)

  const deleteSong = async () => {
    if (!current) return
    setDeleting(true)
    const res = await dispatch(removeSong(current.id))
    setDeleting(false)
    if (removeSong.fulfilled.match(res)) {
      toast.success('Song deleted')
      navigate('/songs')
    }
  }

  const seed = async (count: number) => {
    if (!current) return
    setSeeding(true)
    const toastId = toast.loading(`Seeding ${count.toLocaleString()} notes…`)
    try {
      const { inserted } = await seedNotesApi(current.id, count)
      await dispatch(openSong(current.id))
      reload()
      toast.update(toastId, {
        render: `Seeded ${inserted.toLocaleString()} notes`,
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      })
    } catch {
      toast.dismiss(toastId)
    } finally {
      setSeeding(false)
    }
  }

  return { deleteOpen, openDelete, closeDelete, deleting, deleteSong, seeding, seed }
}
