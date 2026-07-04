import { configureStore } from '@reduxjs/toolkit';

import notificationsReducer from './notificationsSlice';
import songReducer from './songSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    song: songReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
