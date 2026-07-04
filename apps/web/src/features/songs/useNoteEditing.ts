import { useState } from 'react'
import { toast } from 'react-toastify'

import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import type { NoteFormValues } from '~/features/songs/NoteDialog'
import type { HistoryEntry, NotePatch } from '~/features/songs/useEditorHistory'
import { useAppDispatch } from '~/store/hooks'
import { addNote, applyNoteUpsert, editNote, removeNote } from '~/store/songSlice'
import type { Note, SongWithNotes } from '~/types/midi'

interface DialogState {
  open: boolean
  mode: 'create' | 'edit'
  note: Note | null
  values: NoteFormValues
}

const emptyValues: NoteFormValues = {
  title: '',
  description: '',
  track: 1,
  time: 0,
  color: DEFAULT_NOTE_COLOR,
}

export function toPatch(note: Note): NotePatch {
  return {
    title: note.title,
    description: note.description ?? undefined,
    track: note.track,
    time: note.time,
    color: note.color,
  }
}

export function useNoteEditing(current: SongWithNotes | null, record: (entry: HistoryEntry) => void) {
  const dispatch = useAppDispatch()
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: 'create',
    note: null,
    values: emptyValues,
  })

  const openCreate = (track: number, time: number) =>
    setDialog({ open: true, mode: 'create', note: null, values: { ...emptyValues, track, time } })

  const openEdit = (note: Note) =>
    setDialog({
      open: true,
      mode: 'edit',
      note,
      values: {
        title: note.title,
        description: note.description ?? '',
        track: note.track,
        time: note.time,
        color: note.color,
      },
    })

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const submit = async (values: NoteFormValues) => {
    if (!current) return
    const input = {
      title: values.title,
      description: values.description || undefined,
      track: values.track,
      time: values.time,
      color: values.color,
    }
    closeDialog()
    if (dialog.mode === 'create') {
      const res = await dispatch(addNote({ songId: current.id, input }))
      if (addNote.fulfilled.match(res)) {
        toast.success('Note added')
        record({ kind: 'create', note: res.payload })
      }
    } else if (dialog.note) {
      const before = toPatch(dialog.note)
      const res = await dispatch(editNote({ id: dialog.note.id, input }))
      if (editNote.fulfilled.match(res)) {
        toast.success('Note updated')
        record({ kind: 'update', id: dialog.note.id, before, after: toPatch(res.payload) })
      }
    }
  }

  const deleteNote = async () => {
    const note = dialog.note
    closeDialog()
    if (!note) return
    const res = await dispatch(removeNote(note.id))
    if (removeNote.fulfilled.match(res)) {
      toast.success('Note deleted')
      record({ kind: 'delete', note })
    }
  }

  const moveNote = async (note: Note, track: number, time: number) => {
    dispatch(applyNoteUpsert({ ...note, track, time }))
    const res = await dispatch(editNote({ id: note.id, input: { track, time } }))
    if (editNote.rejected.match(res)) {
      dispatch(applyNoteUpsert(note))
      return
    }
    record({
      kind: 'update',
      id: note.id,
      before: toPatch(note),
      after: toPatch({ ...note, track, time }),
    })
  }

  const deleteMany = async (ids: string[]) => {
    if (!current) return
    const targets = current.notes.filter((n) => ids.includes(n.id))
    if (targets.length === 0) return
    let deleted = 0
    for (const note of targets) {
      const res = await dispatch(removeNote(note.id))
      if (removeNote.fulfilled.match(res)) {
        record({ kind: 'delete', note })
        deleted += 1
      }
    }
    if (deleted > 0) toast.success(`Deleted ${deleted} note${deleted > 1 ? 's' : ''}`)
  }

  return { dialog, openCreate, openEdit, closeDialog, submit, deleteNote, moveNote, deleteMany }
}
