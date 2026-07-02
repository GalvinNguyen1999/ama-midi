import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  createNoteApi,
  createSongApi,
  deleteNoteApi,
  getSong,
  listSongs,
  updateNoteApi,
} from '~/apis/midi'
import type { Note, NoteInput, NoteUpdate, Song, SongWithNotes } from '~/types/midi'

interface SongState {
  songs: Song[]
  current: SongWithNotes | null
  loading: boolean
}

const initialState: SongState = {
  songs: [],
  current: null,
  loading: false,
}

export const fetchSongs = createAsyncThunk('song/fetchSongs', () => listSongs())

export const openSong = createAsyncThunk('song/openSong', (id: string) => getSong(id))

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

const songSlice = createSlice({
  name: 'song',
  initialState,
  reducers: {},
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
      .addCase(openSong.fulfilled, (state, action: PayloadAction<SongWithNotes>) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(openSong.rejected, (state) => {
        state.loading = false
      })
      .addCase(addNote.fulfilled, (state, action: PayloadAction<Note>) => {
        if (state.current && state.current.id === action.payload.songId) {
          state.current.notes.push(action.payload)
        }
      })
      .addCase(editNote.fulfilled, (state, action: PayloadAction<Note>) => {
        if (!state.current) return
        const idx = state.current.notes.findIndex((n) => n.id === action.payload.id)
        if (idx >= 0) state.current.notes[idx] = action.payload
      })
      .addCase(removeNote.fulfilled, (state, action: PayloadAction<string>) => {
        if (!state.current) return
        state.current.notes = state.current.notes.filter((n) => n.id !== action.payload)
      })
  },
})

export default songSlice.reducer
