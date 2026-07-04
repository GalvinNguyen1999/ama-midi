import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { getMyInvitesApi, respondInviteApi } from '~/apis/midi'
import type { PendingInvite } from '~/types/midi'

interface InvitesState {
  items: PendingInvite[]
}

const initialState: InvitesState = { items: [] }

export const fetchInvites = createAsyncThunk('invites/fetch', () => getMyInvitesApi())

export const respondInvite = createAsyncThunk(
  'invites/respond',
  async (args: { songId: string; accept: boolean }) => {
    await respondInviteApi(args.songId, args.accept)

    return args
  },
)

const invitesSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvites.fulfilled, (state, action: PayloadAction<PendingInvite[]>) => {
        state.items = action.payload
      })
      .addCase(respondInvite.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.songId !== action.payload.songId)
      })
  },
})

export default invitesSlice.reducer
