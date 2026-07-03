import AddIcon from '@mui/icons-material/Add'
import CircleIcon from '@mui/icons-material/Circle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import SecurityIcon from '@mui/icons-material/Security'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { handleLogoutApi } from '~/apis'
import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { useSongRealtime } from '~/features/realtime/useSongRealtime'
import { NoteDialog, type NoteFormValues } from '~/features/songs/NoteDialog'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  addNote,
  createSong,
  editNote,
  fetchSongs,
  openSong,
  removeNote,
  removeSong,
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

function readEmail(): string {
  try {
    return (JSON.parse(localStorage.getItem('userInfo') ?? '{}') as { email?: string }).email ?? ''
  } catch {
    return ''
  }
}

export function SongWorkspace() {
  const dispatch = useAppDispatch()
  const songs = useAppSelector((s) => s.song.songs)
  const current = useAppSelector((s) => s.song.current)
  const loading = useAppSelector((s) => s.song.loading)

  const connected = useSongRealtime(current?.id)
  const navigate = useNavigate()
  const email = useMemo(readEmail, [])

  const [selectedId, setSelectedId] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [newSongOpen, setNewSongOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  const handleLogout = async () => {
    await handleLogoutApi()
    localStorage.clear()
    navigate('/login')
  }

  const handleCreateSong = async () => {
    setCreating(true)
    const title = newTitle.trim() || `Song ${songs.length + 1}`
    const res = await dispatch(createSong(title))
    setCreating(false)
    if (createSong.fulfilled.match(res)) {
      setNewTitle('')
      setNewSongOpen(false)
      setSelectedId(res.payload.id)
    }
  }

  const handleDeleteSong = async () => {
    if (!current) return
    setDeleting(true)
    const res = await dispatch(removeSong(current.id))
    setDeleting(false)
    if (removeSong.fulfilled.match(res)) {
      setDeleteOpen(false)
      const next = songs.find((s) => s.id !== res.payload)
      setSelectedId(next?.id ?? '')
    }
  }

  const openCreate = (track: number, time: number) => {
    setDialog({ open: true, mode: 'create', note: null, values: { ...emptyValues, track, time } })
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
    if (dialog.mode === 'create') dispatch(addNote({ songId: current.id, input }))
    else if (dialog.note) dispatch(editNote({ id: dialog.note.id, input }))
    closeDialog()
  }

  const handleDelete = () => {
    if (dialog.note) dispatch(removeNote(dialog.note.id))
    closeDialog()
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            AMA-MIDI
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mt: 0.5 }}>
            MIDI Editor
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {current ? (
            <Chip
              size="small"
              icon={<CircleIcon sx={{ fontSize: 10 }} />}
              label={connected ? 'Live' : 'Offline'}
              color={connected ? 'success' : 'default'}
              variant="outlined"
              sx={{ mr: 2 }}
            />
          ) : null}
          <Tooltip title={email || 'Account'}>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 15 }}>
                {(email[0] ?? 'U').toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="body2" color="text.secondary">
                {email || 'Signed in'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                navigate('/2fa-setup')
              }}
            >
              <ListItemIcon>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              Two-factor auth
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 1 }} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Song"
            value={songs.some((s) => s.id === selectedId) ? selectedId : ''}
            onChange={(e) => setSelectedId(e.target.value)}
            sx={{ minWidth: 240 }}
            disabled={songs.length === 0}
          >
            {songs.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.title}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setNewSongOpen(true)}>
            New Song
          </Button>
          {current ? (
            <Chip
              size="small"
              variant="outlined"
              label={`v${current.version} · ${current.notes.length} notes`}
            />
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          {current ? (
            <Tooltip title="Delete song">
              <IconButton color="error" onClick={() => setDeleteOpen(true)}>
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the grid to add a note. Click a note to edit. Time flows top → bottom (0–300s),
          tracks left → right.
        </Typography>

        {loading && !current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : songs.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 460, mx: 'auto', mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              No songs yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first song to start sketching a MIDI sequence.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewSongOpen(true)}>
              Create a song
            </Button>
          </Paper>
        ) : current ? (
          <Box sx={{ maxHeight: '74vh', overflow: 'auto' }}>
            <PianoRoll notes={current.notes} onCreateAt={openCreate} onSelectNote={openEdit} />
          </Box>
        ) : (
          <Typography color="text.secondary">Select a song to open the editor.</Typography>
        )}
      </Container>

      <Dialog open={newSongOpen} onClose={() => setNewSongOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New song</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Song title"
            placeholder={`Song ${songs.length + 1}`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSong()
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSongOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSong} disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete song</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete “{current?.title}” and all its notes? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteSong} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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
