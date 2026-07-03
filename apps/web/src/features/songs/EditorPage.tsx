import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircleIcon from '@mui/icons-material/Circle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LinkIcon from '@mui/icons-material/Link'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { seedNotesApi } from '~/apis/midi'
import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { NoteDialog, type NoteFormValues } from '~/features/songs/NoteDialog'
import { usePlayback } from '~/features/songs/usePlayback'
import { useSongRealtime } from '~/features/songs/useSongRealtime'
import { useWindowedNotes } from '~/features/songs/useWindowedNotes'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { addNote, applyNoteUpsert, editNote, openSong, removeNote, removeSong } from '~/store/songSlice'
import type { Note } from '~/types/midi'
import { readUser } from '~/utils/session'

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

export function EditorPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const user = useMemo(readUser, [])

  const current = useAppSelector((s) => s.song.current)
  const loading = useAppSelector((s) => s.song.loading)

  const { connected, presence } = useSongRealtime(id, user)
  const { playing, playhead, play, stop } = usePlayback(current?.notes ?? [])
  const isOwner = !current?.ownerId || current.ownerId === user?.id

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [perfAnchor, setPerfAnchor] = useState<null | HTMLElement>(null)
  const [seeding, setSeeding] = useState(false)
  const { scrollRef, onScroll, reload } = useWindowedNotes(id, current?.id)
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: 'create',
    note: null,
    values: emptyValues,
  })

  useEffect(() => {
    if (id) dispatch(openSong(id))
  }, [dispatch, id])

  useEffect(() => {
    stop()
  }, [id, stop])

  const copyShareLink = async () => {
    if (!current) return
    const url = `${window.location.origin}/songs/${current.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied — send it to a collaborator')
    } catch {
      toast.info(url)
    }
  }

  const handleDeleteSong = async () => {
    if (!current) return
    setDeleting(true)
    const res = await dispatch(removeSong(current.id))
    setDeleting(false)
    if (removeSong.fulfilled.match(res)) {
      toast.success('Song deleted')
      navigate('/songs')
    }
  }

  const handleSeed = async (count: number) => {
    if (!current) return
    setPerfAnchor(null)
    setSeeding(true)
    const t0 = performance.now()
    try {
      const { inserted } = await seedNotesApi(current.id, count)
      await dispatch(openSong(current.id))
      reload()
      toast.success(`Seeded ${inserted.toLocaleString()} notes in ${Math.round(performance.now() - t0)}ms`)
    } finally {
      setSeeding(false)
    }
  }

  const handleMoveNote = async (note: Note, track: number, time: number) => {
    dispatch(applyNoteUpsert({ ...note, track, time }))
    const res = await dispatch(editNote({ id: note.id, input: { track, time } }))
    if (editNote.rejected.match(res)) dispatch(applyNoteUpsert(note))
  }

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

  const submitDialog = async (values: NoteFormValues) => {
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
      if (addNote.fulfilled.match(res)) toast.success('Note added')
    } else if (dialog.note) {
      const res = await dispatch(editNote({ id: dialog.note.id, input }))
      if (editNote.fulfilled.match(res)) toast.success('Note updated')
    }
  }

  const handleDeleteNote = async () => {
    const note = dialog.note
    closeDialog()
    if (note) {
      const res = await dispatch(removeNote(note.id))
      if (removeNote.fulfilled.match(res)) toast.success('Note deleted')
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 2,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5 }} flexWrap="wrap">
            <Tooltip title="Back to library">
              <IconButton onClick={() => navigate('/songs')} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 260 }}>
              {current?.title ?? 'Loading…'}
            </Typography>
            {current ? (
              <Chip
                size="small"
                variant="outlined"
                label={`v${current.version} · ${current.notes.length.toLocaleString()}/${current.noteCount.toLocaleString()} loaded`}
              />
            ) : null}
            {current?.ownerEmail ? (
              <Chip
                size="small"
                variant="outlined"
                avatar={<Avatar>{current.ownerEmail[0]?.toUpperCase()}</Avatar>}
                label={isOwner ? 'Owned by you' : current.ownerEmail}
              />
            ) : null}

            <Box sx={{ flexGrow: 1 }} />

            {current && presence.length > 0 ? (
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 13 } }}>
                {presence.map((p) => (
                  <Tooltip key={p.id} title={p.id === user?.id ? `${p.email} (you)` : p.email}>
                    <Avatar sx={{ bgcolor: p.id === user?.id ? 'primary.main' : 'grey.700' }}>
                      {(p.email[0] ?? '?').toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            ) : null}
            {current ? (
              <Chip
                size="small"
                icon={<CircleIcon sx={{ fontSize: 10 }} />}
                label={connected ? 'Live' : 'Offline'}
                color={connected ? 'success' : 'default'}
                variant="outlined"
              />
            ) : null}
            {current && current.notes.length > 0 ? (
              <Button
                size="small"
                variant={playing ? 'contained' : 'outlined'}
                color={playing ? 'error' : 'primary'}
                startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
                onClick={playing ? stop : play}
              >
                {playing ? `Stop · ${playhead.toFixed(1)}s` : 'Play'}
              </Button>
            ) : null}
            {current ? (
              <Tooltip title="Copy a link to invite collaborators to this song">
                <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={copyShareLink}>
                  Invite
                </Button>
              </Tooltip>
            ) : null}
            {current && isOwner ? (
              <Tooltip title="Delete song">
                <IconButton color="error" size="small" onClick={() => setDeleteOpen(true)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            {current ? (
              <Tooltip title="Developer tools">
                <span>
                  <IconButton size="small" onClick={(e) => setPerfAnchor(e.currentTarget)} disabled={seeding}>
                    {seeding ? <CircularProgress size={18} /> : <MoreVertIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
            <Menu anchorEl={perfAnchor} open={Boolean(perfAnchor)} onClose={() => setPerfAnchor(null)}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Typography variant="caption" color="text.secondary">
                  Developer · seed stress notes
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => handleSeed(1000)}>+ 1,000 notes</MenuItem>
              <MenuItem onClick={() => handleSeed(10000)}>+ 10,000 notes</MenuItem>
            </Menu>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the grid to add a note, drag a note to move it, click a note to edit. Time flows top →
          bottom (0–300s), tracks left → right.
        </Typography>

        {loading && !current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : current ? (
          <Box ref={scrollRef} onScroll={onScroll} sx={{ maxHeight: '72vh', overflow: 'auto' }}>
            <PianoRoll
              notes={current.notes}
              onCreateAt={openCreate}
              onSelectNote={openEdit}
              onMoveNote={handleMoveNote}
              playhead={playing ? playhead : null}
            />
          </Box>
        ) : (
          <Typography color="text.secondary">Song not found.</Typography>
        )}
      </Container>

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
        onDelete={handleDeleteNote}
      />
    </>
  )
}
