import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CircleIcon from '@mui/icons-material/Circle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import HistoryIcon from '@mui/icons-material/History'
import LinkIcon from '@mui/icons-material/Link'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RedoIcon from '@mui/icons-material/Redo'
import RepeatIcon from '@mui/icons-material/Repeat'
import StopIcon from '@mui/icons-material/Stop'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UndoIcon from '@mui/icons-material/Undo'
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { seedNotesApi } from '~/apis/midi'
import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { DeleteSongDialog } from '~/features/songs/DeleteSongDialog'
import { HistoryDrawer } from '~/features/songs/HistoryDrawer'
import { NoteDialog, type NoteFormValues } from '~/features/songs/NoteDialog'
import { OnboardingCallout } from '~/features/songs/OnboardingCallout'
import { SharePopover } from '~/features/songs/SharePopover'
import { SuggestionBar } from '~/features/songs/SuggestionBar'
import { useEditorHistory, type NotePatch } from '~/features/songs/useEditorHistory'
import { useMidiIO } from '~/features/songs/useMidiIO'
import { usePlayback, type Timbre } from '~/features/songs/usePlayback'
import { useSharing } from '~/features/songs/useSharing'
import { useSongRealtime } from '~/features/songs/useSongRealtime'
import { useSongTitle } from '~/features/songs/useSongTitle'
import { useSuggestions } from '~/features/songs/useSuggestions'
import { useWindowedNotes } from '~/features/songs/useWindowedNotes'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  addNote,
  applyNoteUpsert,
  editNote,
  openSong,
  removeNote,
  removeSong,
} from '~/store/songSlice'
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

function toPatch(note: Note): NotePatch {
  return {
    title: note.title,
    description: note.description ?? undefined,
    track: note.track,
    time: note.time,
    color: note.color,
  }
}

export function EditorPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const user = useMemo(readUser, [])

  const current = useAppSelector((s) => s.song.current)
  const loading = useAppSelector((s) => s.song.loading)
  const notesLoading = useAppSelector((s) => s.song.notesLoading)

  const [timbre, setTimbre] = useState<Timbre>('sine')
  const [loop, setLoop] = useState(false)

  const { connected, presence } = useSongRealtime(id, user, {
    onSongDeleted: (actor) => {
      toast.info(`${actor ? actor.split('@')[0] : 'The owner'} deleted this song`)
      navigate('/songs')
    },
  })
  const { playing, playhead, play, stop } = usePlayback(current?.notes ?? [], { timbre, loop })
  const isOwner = !current?.ownerId || current.ownerId === user?.id
  const canEdit = isOwner || current?.shareMode === 'edit'
  const readOnly = Boolean(current) && !canEdit
  const collaborators = current
    ? current.collaborators.filter((c) => c.userId !== current.ownerId)
    : []

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const title = useSongTitle(current, isOwner)
  const sharing = useSharing(current)
  const { scrollRef, onScroll, reload } = useWindowedNotes(id)
  const {
    record: recordHistory,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useEditorHistory({
    create: async (note) => {
      if (!current) return null
      const res = await dispatch(addNote({ songId: current.id, input: toPatch(note) }))
      return addNote.fulfilled.match(res) ? res.payload : null
    },
    remove: async (noteId) => {
      const res = await dispatch(removeNote(noteId))
      return removeNote.fulfilled.match(res)
    },
    update: async (noteId, patch) => {
      const res = await dispatch(editNote({ id: noteId, input: patch }))
      return editNote.fulfilled.match(res)
    },
  })
  const { suggestions, suggesting, acceptingAll, suggest, accept, acceptAll, clear } = useSuggestions(
    current?.id,
    (note) => recordHistory({ kind: 'create', note }),
  )
  const { exporting, importing, fileInputRef, exportMidi, importMidi, onFile } = useMidiIO({
    songId: current?.id,
    title: current?.title ?? '',
    bpm: current?.bpm ?? 120,
    reload,
  })
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

  useEffect(() => {
    resetHistory()
  }, [id, resetHistory])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      e.preventDefault()
      if (key === 'y' || e.shiftKey) redo()
      else undo()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

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
    setMoreAnchor(null)
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

  const handleMoveNote = async (note: Note, track: number, time: number) => {
    dispatch(applyNoteUpsert({ ...note, track, time }))
    const res = await dispatch(editNote({ id: note.id, input: { track, time } }))
    if (editNote.rejected.match(res)) {
      dispatch(applyNoteUpsert(note))
      return
    }
    recordHistory({
      kind: 'update',
      id: note.id,
      before: toPatch(note),
      after: toPatch({ ...note, track, time }),
    })
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
      if (addNote.fulfilled.match(res)) {
        toast.success('Note added')
        recordHistory({ kind: 'create', note: res.payload })
      }
    } else if (dialog.note) {
      const before = toPatch(dialog.note)
      const res = await dispatch(editNote({ id: dialog.note.id, input }))
      if (editNote.fulfilled.match(res)) {
        toast.success('Note updated')
        recordHistory({ kind: 'update', id: dialog.note.id, before, after: toPatch(res.payload) })
      }
    }
  }

  const handleDeleteMany = async (ids: string[]) => {
    if (!current) return
    const targets = current.notes.filter((n) => ids.includes(n.id))
    if (targets.length === 0) return

    let deleted = 0
    for (const note of targets) {
      const res = await dispatch(removeNote(note.id))
      if (removeNote.fulfilled.match(res)) {
        recordHistory({ kind: 'delete', note })
        deleted += 1
      }
    }
    if (deleted > 0) toast.success(`Deleted ${deleted} note${deleted > 1 ? 's' : ''}`)
  }

  const handleDeleteNote = async () => {
    const note = dialog.note
    closeDialog()
    if (note) {
      const res = await dispatch(removeNote(note.id))
      if (removeNote.fulfilled.match(res)) {
        toast.success('Note deleted')
        recordHistory({ kind: 'delete', note })
      }
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
            {title.editing ? (
              <TextField
                autoFocus
                size="small"
                value={title.draft}
                onChange={(e) => title.setDraft(e.target.value)}
                onBlur={title.commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') title.commit()
                  if (e.key === 'Escape') title.cancel()
                }}
                sx={{ width: 260 }}
              />
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 260 }}>
                  {current?.title ?? 'Loading…'}
                </Typography>
                {current && isOwner ? (
                  <Tooltip title="Rename song">
                    <IconButton size="small" onClick={title.start}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            )}
            {current ? (
              <Chip
                size="small"
                variant="outlined"
                label={`${current.noteCount.toLocaleString()} note${current.noteCount === 1 ? '' : 's'}`}
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
            {readOnly ? (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                icon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                label="View only"
              />
            ) : null}
            {current && canEdit ? (
              <>
                <Tooltip title="Undo (⌘Z)">
                  <span>
                    <IconButton size="small" onClick={() => undo()} disabled={!canUndo}>
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Redo (⇧⌘Z)">
                  <span>
                    <IconButton size="small" onClick={() => redo()} disabled={!canRedo}>
                      <RedoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Suggest the next note (AI)">
                  <span>
                    <IconButton size="small" color="secondary" onClick={suggest} disabled={suggesting}>
                      <AutoAwesomeIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            ) : null}
            {current && current.notes.length > 0 ? (
              <>
                <Button
                  size="small"
                  variant={playing ? 'contained' : 'outlined'}
                  color={playing ? 'error' : 'primary'}
                  startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
                  onClick={playing ? stop : play}
                >
                  {playing ? `Stop · ${playhead.toFixed(1)}s` : 'Play'}
                </Button>
                <Tooltip title="Loop playback">
                  <ToggleButton
                    value="loop"
                    size="small"
                    selected={loop}
                    onChange={() => setLoop((v) => !v)}
                    sx={{ px: 1, py: 0.5 }}
                  >
                    <RepeatIcon fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Instrument tone">
                  <Select
                    size="small"
                    value={timbre}
                    onChange={(e) => setTimbre(e.target.value as Timbre)}
                    sx={{ '& .MuiSelect-select': { py: 0.5 } }}
                  >
                    <MenuItem value="sine">Sine</MenuItem>
                    <MenuItem value="triangle">Triangle</MenuItem>
                    <MenuItem value="square">Square</MenuItem>
                    <MenuItem value="sawtooth">Saw</MenuItem>
                  </Select>
                </Tooltip>
              </>
            ) : null}
            {current ? (
              <Tooltip title="Share this song">
                <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={sharing.open}>
                  Share
                </Button>
              </Tooltip>
            ) : null}
            {current ? (
              <Tooltip title="More actions">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => setMoreAnchor(e.currentTarget)}
                    disabled={seeding}
                  >
                    {seeding ? <CircularProgress size={18} /> : <MoreVertIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mid,.midi,audio/midi,audio/x-midi"
              style={{ display: 'none' }}
              onChange={onFile}
            />
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
              <MenuItem
                onClick={() => {
                  setMoreAnchor(null)
                  exportMidi()
                }}
                disabled={exporting}
              >
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export MIDI</ListItemText>
              </MenuItem>
              {canEdit ? (
                <MenuItem
                  onClick={() => {
                    setMoreAnchor(null)
                    importMidi()
                  }}
                  disabled={importing}
                >
                  <ListItemIcon>
                    <FileUploadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Import MIDI</ListItemText>
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() => {
                  setMoreAnchor(null)
                  setHistoryOpen(true)
                }}
              >
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Activity history</ListItemText>
              </MenuItem>
              {isOwner ? (
                <MenuItem
                  onClick={() => {
                    setMoreAnchor(null)
                    setDeleteOpen(true)
                  }}
                >
                  <ListItemIcon>
                    <DeleteOutlineIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText sx={{ color: 'error.main' }}>Delete song</ListItemText>
                </MenuItem>
              ) : null}
              {import.meta.env.DEV && canEdit
                ? [
                    <Divider key="dev-divider" />,
                    <MenuItem key="dev-caption" disabled sx={{ opacity: '1 !important' }}>
                      <Typography variant="caption" color="text.secondary">
                        Dev · v{current?.version ?? 0} ·{' '}
                        {(current?.notes.length ?? 0).toLocaleString()}/
                        {(current?.noteCount ?? 0).toLocaleString()} loaded
                      </Typography>
                    </MenuItem>,
                    <MenuItem key="seed-1k" onClick={() => handleSeed(1000)}>
                      + 1,000 notes
                    </MenuItem>,
                    <MenuItem key="seed-10k" onClick={() => handleSeed(10000)}>
                      + 10,000 notes
                    </MenuItem>,
                  ]
                : null}
            </Menu>

            <SharePopover
              open={Boolean(sharing.anchor)}
              anchorEl={sharing.anchor}
              onClose={sharing.close}
              isOwner={isOwner}
              shareUrl={current ? `${window.location.origin}/songs/${current.id}` : ''}
              shareMode={current?.shareMode ?? 'edit'}
              onSetShare={sharing.setShare}
              onCopy={sharing.copyLink}
              inviteEmail={sharing.inviteEmail}
              onInviteEmailChange={sharing.setInviteEmail}
              inviting={sharing.inviting}
              onInvite={sharing.invite}
              collaborators={collaborators}
              onRemoveCollaborator={sharing.removeCollaborator}
            />

            <HistoryDrawer
              songId={id}
              version={current?.version}
              open={historyOpen}
              onClose={() => setHistoryOpen(false)}
            />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {current ? <OnboardingCallout /> : null}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the grid to add a note, drag a note to move it, click a note to edit. Time flows top →
          bottom (0–300s), tracks left → right.
        </Typography>

        {loading && !current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : current ? (
          <Box sx={{ position: 'relative' }}>
            <Box ref={scrollRef} onScroll={onScroll} sx={{ maxHeight: '72vh', overflow: 'auto' }}>
              <PianoRoll
                notes={current.notes}
                onCreateAt={openCreate}
                onSelectNote={openEdit}
                onMoveNote={handleMoveNote}
                onDeleteMany={handleDeleteMany}
                playhead={playing ? playhead : null}
                loading={notesLoading > 0}
                readOnly={readOnly}
                suggestions={canEdit ? suggestions : []}
                onAcceptSuggestion={accept}
              />
            </Box>

            {notesLoading > 0 ? (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 5,
                  pointerEvents: 'none',
                }}
              >
                <CircularProgress size={14} thickness={5} />
                <Typography variant="caption" color="text.secondary">
                  Loading notes…
                </Typography>
              </Paper>
            ) : null}

            {suggestions.length > 0 ? (
              <SuggestionBar
                count={suggestions.length}
                acceptingAll={acceptingAll}
                suggesting={suggesting}
                onAcceptAll={acceptAll}
                onAnother={suggest}
                onDismiss={clear}
              />
            ) : null}
          </Box>
        ) : (
          <Typography color="text.secondary">Song not found.</Typography>
        )}
      </Container>

      <DeleteSongDialog
        open={deleteOpen}
        title={current?.title ?? ''}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteSong}
      />

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
