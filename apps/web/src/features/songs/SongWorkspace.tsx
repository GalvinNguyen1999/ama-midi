import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { NoteDialog, type NoteFormValues } from '~/features/songs/NoteDialog'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  addNote,
  createSong,
  editNote,
  fetchSongs,
  openSong,
  removeNote,
} from '~/store/songSlice'
import type { Note } from '~/types/midi'

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

export function SongWorkspace() {
  const dispatch = useAppDispatch()
  const songs = useAppSelector((s) => s.song.songs)
  const current = useAppSelector((s) => s.song.current)

  const [selectedId, setSelectedId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: 'create',
    note: null,
    values: emptyValues,
  })

  useEffect(() => {
    dispatch(fetchSongs())
  }, [dispatch])

  useEffect(() => {
    if (!selectedId && songs.length > 0) setSelectedId(songs[0].id)
  }, [songs, selectedId])

  useEffect(() => {
    if (selectedId) dispatch(openSong(selectedId))
  }, [dispatch, selectedId])

  const handleCreateSong = async () => {
    const title = newTitle.trim() || `Song ${songs.length + 1}`
    const res = await dispatch(createSong(title))
    if (createSong.fulfilled.match(res)) {
      setNewTitle('')
      setSelectedId(res.payload.id)
    }
  }

  const openCreate = (track: number, time: number) => {
    setDialog({
      open: true,
      mode: 'create',
      note: null,
      values: { ...emptyValues, track, time },
    })
  }

  const openEdit = (note: Note) => {
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
  }

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }))

  const submitDialog = (values: NoteFormValues) => {
    if (!current) return
    const input = {
      title: values.title,
      description: values.description || undefined,
      track: values.track,
      time: values.time,
      color: values.color,
    }
    if (dialog.mode === 'create') {
      dispatch(addNote({ songId: current.id, input }))
    } else if (dialog.note) {
      dispatch(editNote({ id: dialog.note.id, input }))
    }
    closeDialog()
  }

  const handleDelete = () => {
    if (dialog.note) dispatch(removeNote(dialog.note.id))
    closeDialog()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AMA-MIDI
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <TextField
          select
          size="small"
          label="Song"
          value={songs.some((s) => s.id === selectedId) ? selectedId : ''}
          onChange={(e) => setSelectedId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {songs.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="New song title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button variant="outlined" onClick={handleCreateSong}>
          New Song
        </Button>
        {current ? (
          <Typography variant="body2" color="text.secondary">
            v{current.version} · {current.notes.length} notes
          </Typography>
        ) : null}
      </Stack>

      {current ? (
        <Box sx={{ maxHeight: '72vh', overflow: 'auto' }}>
          <PianoRoll notes={current.notes} onCreateAt={openCreate} onSelectNote={openEdit} />
        </Box>
      ) : (
        <Typography color="text.secondary">Create or select a song to start.</Typography>
      )}

      <NoteDialog
        open={dialog.open}
        mode={dialog.mode}
        initial={dialog.values}
        onClose={closeDialog}
        onSubmit={submitDialog}
        onDelete={handleDelete}
      />
    </Box>
  )
}
