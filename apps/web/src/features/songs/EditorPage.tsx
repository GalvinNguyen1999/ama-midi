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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Popover,
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

import { inviteCollaboratorApi, removeCollaboratorApi, seedNotesApi } from '~/apis/midi'
import { DEFAULT_NOTE_COLOR } from '~/features/pianoRoll/config'
import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { HistoryDrawer } from '~/features/songs/HistoryDrawer'
import { NoteDialog, type NoteFormValues } from '~/features/songs/NoteDialog'
import { OnboardingCallout } from '~/features/songs/OnboardingCallout'
import { useEditorHistory, type NotePatch } from '~/features/songs/useEditorHistory'
import { useMidiIO } from '~/features/songs/useMidiIO'
import { usePlayback, type Timbre } from '~/features/songs/usePlayback'
import { useSongRealtime } from '~/features/songs/useSongRealtime'
import { useSuggestions } from '~/features/songs/useSuggestions'
import { useWindowedNotes } from '~/features/songs/useWindowedNotes'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  addNote,
  applyCollaboratorRemoved,
  applyCollaboratorUpsert,
  applyNoteUpsert,
  editNote,
  openSong,
  removeNote,
  removeSong,
  renameSong,
  setShareMode,
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
  const [perfAnchor, setPerfAnchor] = useState<null | HTMLElement>(null)
  const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [seeding, setSeeding] = useState(false)
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

  const startEditTitle = () => {
    if (!current || !isOwner) return
    setTitleDraft(current.title)
    setEditingTitle(true)
  }

  const commitTitle = async () => {
    setEditingTitle(false)
    const title = titleDraft.trim()
    if (!current || !title || title === current.title) return
    const res = await dispatch(renameSong({ id: current.id, title }))
    if (renameSong.fulfilled.match(res)) toast.success('Song renamed')
  }

  const handleInvite = async () => {
    const email = inviteEmail.trim()
    if (!current || !email) return
    setInviting(true)
    try {
      const collaborator = await inviteCollaboratorApi(current.id, email)
      dispatch(applyCollaboratorUpsert({ songId: current.id, collaborator }))
      toast.success(`Invited ${collaborator.email}`)
      setInviteEmail('')
    } catch {
      // the axios interceptor surfaces the error message
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorEmail: string) => {
    if (!current) return
    try {
      await removeCollaboratorApi(current.id, collaboratorId)
      dispatch(applyCollaboratorRemoved({ songId: current.id, userId: collaboratorId }))
      toast.success(`Removed ${collaboratorEmail}`)
    } catch {
      // the axios interceptor surfaces the error message
    }
  }

  const handleSetShare = async (mode: 'edit' | 'view') => {
    if (!current || current.shareMode === mode) return
    const res = await dispatch(setShareMode({ id: current.id, shareMode: mode }))
    if (setShareMode.fulfilled.match(res)) {
      toast.success(mode === 'view' ? 'Song is now view-only' : 'Anyone with the link can edit')
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
            {editingTitle ? (
              <TextField
                autoFocus
                size="small"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
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
                    <IconButton size="small" onClick={startEditTitle}>
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
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={(e) => setShareAnchor(e.currentTarget)}
                >
                  Share
                </Button>
              </Tooltip>
            ) : null}
            {current ? (
              <Tooltip title="Export as MIDI (.mid)">
                <span>
                  <IconButton size="small" onClick={exportMidi} disabled={exporting}>
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
            {current && canEdit ? (
              <Tooltip title="Import a MIDI file (.mid)">
                <span>
                  <IconButton size="small" onClick={importMidi} disabled={importing}>
                    <FileUploadIcon fontSize="small" />
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
            {current ? (
              <Tooltip title="Activity history">
                <IconButton size="small" onClick={() => setHistoryOpen(true)}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {current && isOwner ? (
              <Tooltip title="Delete song">
                <IconButton color="error" size="small" onClick={() => setDeleteOpen(true)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            {current && canEdit ? (
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
                  Developer · v{current?.version ?? 0} ·{' '}
                  {(current?.notes.length ?? 0).toLocaleString()}/
                  {(current?.noteCount ?? 0).toLocaleString()} loaded
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => handleSeed(1000)}>+ 1,000 notes</MenuItem>
              <MenuItem onClick={() => handleSeed(10000)}>+ 10,000 notes</MenuItem>
            </Menu>

            <Popover
              open={Boolean(shareAnchor)}
              anchorEl={shareAnchor}
              onClose={() => setShareAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { p: 2, width: 340 } } }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Share this song
              </Typography>

              {isOwner ? (
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <InputLabel id="share-mode-label">Link access</InputLabel>
                  <Select
                    labelId="share-mode-label"
                    label="Link access"
                    value={current?.shareMode ?? 'edit'}
                    onChange={(e) => handleSetShare(e.target.value as 'edit' | 'view')}
                  >
                    <MenuItem value="edit">Anyone with the link can edit</MenuItem>
                    <MenuItem value="view">Anyone with the link can view</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Anyone with the link can {current?.shareMode === 'view' ? 'view' : 'edit'}.
                </Typography>
              )}

              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  value={current ? `${window.location.origin}/songs/${current.id}` : ''}
                  slotProps={{ input: { readOnly: true } }}
                  onFocus={(e) => e.target.select()}
                />
                <Button variant="contained" startIcon={<LinkIcon />} onClick={copyShareLink}>
                  Copy
                </Button>
              </Stack>

              {isOwner ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 0.75 }}>
                    Invite a registered user by email
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      type="email"
                      placeholder="name@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleInvite()
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleInvite}
                      loading={inviting}
                      disabled={!inviteEmail.trim()}
                    >
                      Invite
                    </Button>
                  </Stack>

                  {collaborators.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        People with access
                      </Typography>
                      <Stack spacing={0.5}>
                        {collaborators.map((c) => (
                          <Stack key={c.userId} direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {c.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                              {c.email}
                            </Typography>
                            {c.status === 'pending' ? (
                              <Chip size="small" variant="outlined" color="warning" label="Pending" />
                            ) : null}
                            <Tooltip title="Remove access">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveCollaborator(c.userId, c.email)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </>
              ) : null}
            </Popover>

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
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5,
                }}
              >
                <AutoAwesomeIcon fontSize="small" color="secondary" />
                <Typography variant="caption" color="text.secondary">
                  {suggestions.length} suggested — click a ghost, or
                </Typography>
                <Button size="small" variant="contained" onClick={acceptAll} loading={acceptingAll}>
                  Accept all
                </Button>
                <Button size="small" onClick={suggest} disabled={suggesting || acceptingAll}>
                  Another
                </Button>
                <Button size="small" color="inherit" onClick={clear} disabled={acceptingAll}>
                  Dismiss
                </Button>
              </Paper>
            ) : null}
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
          <Button color="error" variant="contained" onClick={handleDeleteSong} loading={deleting}>
            Delete
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
