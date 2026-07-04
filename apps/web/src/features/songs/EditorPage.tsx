import { Box, CircularProgress, Container, Paper, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { PianoRoll } from '~/features/pianoRoll/PianoRoll'
import { DeleteSongDialog } from '~/features/songs/DeleteSongDialog'
import { EditorToolbar } from '~/features/songs/EditorToolbar'
import { NoteDialog } from '~/features/songs/NoteDialog'
import { OnboardingCallout } from '~/features/songs/OnboardingCallout'
import { SuggestionBar } from '~/features/songs/SuggestionBar'
import { useEditorHistory } from '~/features/songs/useEditorHistory'
import { useMidiIO } from '~/features/songs/useMidiIO'
import { useNoteEditing, toPatch } from '~/features/songs/useNoteEditing'
import { usePlayback, type Timbre } from '~/features/songs/usePlayback'
import { useSharing } from '~/features/songs/useSharing'
import { useSongActions } from '~/features/songs/useSongActions'
import { useSongRealtime } from '~/features/songs/useSongRealtime'
import { useSongTitle } from '~/features/songs/useSongTitle'
import { useSuggestions } from '~/features/songs/useSuggestions'
import { useUndoRedoShortcuts } from '~/features/songs/useUndoRedoShortcuts'
import { useWindowedNotes } from '~/features/songs/useWindowedNotes'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { addNote, editNote, openSong, removeNote } from '~/store/songSlice'
import { readUser } from '~/utils/session'

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

  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const title = useSongTitle(current, isOwner)
  const sharing = useSharing(current)
  const { scrollRef, onScroll, reload } = useWindowedNotes(id)
  const songActions = useSongActions({ current, reload, navigate })
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
  const notes = useNoteEditing(current, recordHistory)

  useEffect(() => {
    if (id) dispatch(openSong(id))
  }, [dispatch, id])

  useEffect(() => {
    stop()
  }, [id, stop])

  useEffect(() => {
    resetHistory()
  }, [id, resetHistory])

  useUndoRedoShortcuts(undo, redo)

  return (
    <>
      <EditorToolbar
        songId={id}
        current={current}
        user={user}
        isOwner={isOwner}
        canEdit={canEdit}
        readOnly={readOnly}
        connected={connected}
        presence={presence}
        collaborators={collaborators}
        onBack={() => navigate('/songs')}
        title={title}
        sharing={sharing}
        songActions={songActions}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        suggest={suggest}
        suggesting={suggesting}
        playing={playing}
        playhead={playhead}
        onPlay={play}
        onStop={stop}
        loop={loop}
        onToggleLoop={() => setLoop((v) => !v)}
        timbre={timbre}
        onTimbreChange={setTimbre}
        fileInputRef={fileInputRef}
        onFile={onFile}
        exportMidi={exportMidi}
        exporting={exporting}
        importMidi={importMidi}
        importing={importing}
        moreAnchor={moreAnchor}
        onOpenMore={(e) => setMoreAnchor(e.currentTarget)}
        onCloseMore={() => setMoreAnchor(null)}
        historyOpen={historyOpen}
        onOpenHistory={() => setHistoryOpen(true)}
        onCloseHistory={() => setHistoryOpen(false)}
        showDevTools={import.meta.env.DEV}
      />

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
                onCreateAt={notes.openCreate}
                onSelectNote={notes.openEdit}
                onMoveNote={notes.moveNote}
                onDeleteMany={notes.deleteMany}
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
        open={songActions.deleteOpen}
        title={current?.title ?? ''}
        deleting={songActions.deleting}
        onClose={songActions.closeDelete}
        onConfirm={songActions.deleteSong}
      />

      <NoteDialog
        open={notes.dialog.open}
        mode={notes.dialog.mode}
        initial={notes.dialog.values}
        onClose={notes.closeDialog}
        onSubmit={notes.submit}
        onDelete={notes.deleteNote}
      />
    </>
  )
}
