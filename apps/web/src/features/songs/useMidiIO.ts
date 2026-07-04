import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { toast } from 'react-toastify'

import { getAllNotes, importMidiApi } from '~/apis/midi'
import { notesToMidi } from '~/features/songs/midi'
import { useAppDispatch } from '~/store/hooks'
import { openSong } from '~/store/songSlice'

interface Args {
  songId: string | undefined
  title: string
  bpm: number
  reload: () => void
}

export function useMidiIO({ songId, title, bpm, reload }: Args) {
  const dispatch = useAppDispatch()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportMidi = async () => {
    if (!songId) return
    setExporting(true)
    const toastId = toast.loading('Preparing MIDI…')
    try {
      const notes = await getAllNotes(songId)
      if (notes.length === 0) {
        toast.update(toastId, {
          render: 'This song has no notes to export',
          type: 'info',
          isLoading: false,
          autoClose: 3000,
        })
        return
      }
      const bytes = new Uint8Array(notesToMidi(notes, bpm))
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || 'song'}.mid`
      link.click()
      URL.revokeObjectURL(url)
      toast.update(toastId, { render: 'MIDI exported', type: 'success', isLoading: false, autoClose: 2000 })
    } catch {
      toast.dismiss(toastId)
    } finally {
      setExporting(false)
    }
  }

  const importMidi = () => fileInputRef.current?.click()

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !songId) return
    setImporting(true)
    const toastId = toast.loading('Importing MIDI…')
    try {
      const buffer = await file.arrayBuffer()
      const res = await importMidiApi(songId, buffer)
      await dispatch(openSong(songId))
      reload()
      toast.update(toastId, {
        render: `Imported ${res.inserted.toLocaleString()} notes`,
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      })
    } catch {
      toast.dismiss(toastId)
    } finally {
      setImporting(false)
    }
  }

  return { exporting, importing, fileInputRef, exportMidi, importMidi, onFile }
}
