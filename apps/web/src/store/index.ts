import { configureStore } from '@reduxjs/toolkit';

import invitesReducer from './invitesSlice';
import songReducer from './songSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    song: songReducer,
    invites: invitesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
