import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  createNoteApi,
  createSongApi,
  deleteNoteApi,
  deleteSongApi,
  getNotesWindow,
  getSong,
  listSongs,
  setShareModeApi,
  updateNoteApi,
} from '~/apis/midi'
import type { Note, NoteInput, NoteUpdate, Song, SongDetail, SongWithNotes } from '~/types/midi'

export const CHUNK_SECONDS = 30

interface SongState {
  songs: Song[]
  current: SongWithNotes | null
  loadedChunks: number[]
  loadGeneration: number
  notesLoading: number
  loading: boolean
}

const initialState: SongState = {
  songs: [],
  current: null,
  loadedChunks: [],
  loadGeneration: 0,
  notesLoading: 0,
  loading: false,
}

function upsertNote(state: SongState, note: Note) {
  if (!state.current || state.current.id !== note.songId) return

  const idx = state.current.notes.findIndex((n) => n.id === note.id)

  if (idx >= 0) {
    state.current.notes[idx] = note
  } else {
    state.current.notes.push(note)
  }
}

function removeNoteFromState(state: SongState, songId: string, noteId: string) {
  if (!state.current || state.current.id !== songId) return
  state.current.notes = state.current.notes.filter((n) => n.id !== noteId)
}

export const fetchSongs = createAsyncThunk('song/fetchSongs', () => listSongs())

export const openSong = createAsyncThunk('song/openSong', (id: string) => getSong(id))

export const loadNotes = createAsyncThunk(
  'song/loadNotes',
  async (args: { songId: string; chunk: number }, { getState }) => {
    const generation = (getState() as { song: SongState }).song.loadGeneration
    const from = args.chunk * CHUNK_SECONDS
    const notes = await getNotesWindow(args.songId, from, from + CHUNK_SECONDS)
    return { songId: args.songId, chunk: args.chunk, notes, generation }
  },
)

export const createSong = createAsyncThunk('song/createSong', (title: string) =>
  createSongApi({ title }),
)

export const addNote = createAsyncThunk(
  'song/addNote',
  (args: { songId: string; input: NoteInput }) => createNoteApi(args.songId, args.input),
)

export const editNote = createAsyncThunk(
  'song/editNote',
  (args: { id: string; input: NoteUpdate }) => updateNoteApi(args.id, args.input),
)

export const removeNote = createAsyncThunk('song/removeNote', async (id: string) => {
  await deleteNoteApi(id)
  return id
})

export const removeSong = createAsyncThunk('song/removeSong', async (id: string) => {
  await deleteSongApi(id)
  return id
})

export const setShareMode = createAsyncThunk(
  'song/setShareMode',
  (args: { id: string; shareMode: 'edit' | 'view' }) => setShareModeApi(args.id, args.shareMode),
)

const songSlice = createSlice({
  name: 'song',
  initialState,
  reducers: {
    applyNoteUpsert(state, action: PayloadAction<Note>) {
      upsertNote(state, action.payload)
    },
    applyNoteRemove(state, action: PayloadAction<{ songId: string; noteId: string }>) {
      removeNoteFromState(state, action.payload.songId, action.payload.noteId)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSongs.fulfilled, (state, action: PayloadAction<Song[]>) => {
        state.songs = action.payload
      })
      .addCase(createSong.fulfilled, (state, action: PayloadAction<Song>) => {
        state.songs.unshift(action.payload)
      })
      .addCase(openSong.pending, (state) => {
        state.loading = true
      })
      .addCase(openSong.fulfilled, (state, action: PayloadAction<SongDetail>) => {
        state.loading = false
        state.current = { ...action.payload, notes: [] }
        state.loadedChunks = []
        state.loadGeneration += 1
        state.notesLoading = 0
      })
      .addCase(openSong.rejected, (state) => {
        state.loading = false
      })
      .addCase(loadNotes.pending, (state) => {
        state.notesLoading += 1
      })
      .addCase(loadNotes.fulfilled, (state, action) => {
        state.notesLoading = Math.max(0, state.notesLoading - 1)
        const { songId, chunk, notes, generation } = action.payload
        if (!state.current || state.current.id !== songId) return
        if (generation !== state.loadGeneration) return
        const existing = new Set(state.current.notes.map((n) => n.id))
        for (const n of notes) if (!existing.has(n.id)) state.current.notes.push(n)
        if (!state.loadedChunks.includes(chunk)) state.loadedChunks.push(chunk)
      })
      .addCase(loadNotes.rejected, (state) => {
        state.notesLoading = Math.max(0, state.notesLoading - 1)
      })
      .addCase(addNote.fulfilled, (state, action: PayloadAction<Note>) => {
        upsertNote(state, action.payload)
      })
      .addCase(editNote.fulfilled, (state, action: PayloadAction<Note>) => {
        upsertNote(state, action.payload)
      })
      .addCase(removeNote.fulfilled, (state, action: PayloadAction<string>) => {
        if (state.current) removeNoteFromState(state, state.current.id, action.payload)
      })
      .addCase(removeSong.fulfilled, (state, action: PayloadAction<string>) => {
        state.songs = state.songs.filter((s) => s.id !== action.payload)
        if (state.current?.id === action.payload) state.current = null
      })
      .addCase(setShareMode.fulfilled, (state, action: PayloadAction<Song>) => {
        const updated = action.payload
        if (state.current?.id === updated.id) state.current.shareMode = updated.shareMode
        const row = state.songs.find((s) => s.id === updated.id)
        if (row) row.shareMode = updated.shareMode
      })
  },
})

export const { applyNoteUpsert, applyNoteRemove } = songSlice.actions
export default songSlice.reducer
