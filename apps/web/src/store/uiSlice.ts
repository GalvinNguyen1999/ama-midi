import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedTrack: number | null;
}

const initialState: UiState = {
  selectedTrack: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectTrack(state, action: PayloadAction<number | null>) {
      state.selectedTrack = action.payload;
    },
  },
});

export const { selectTrack } = uiSlice.actions;
export default uiSlice.reducer;
