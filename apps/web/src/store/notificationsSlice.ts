import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export interface NotificationItem {
  id: string
  songId: string
  title: string
  by: string
  at: number
  read: boolean
}

const STORAGE_KEY = 'ama-midi:notifications'
const MAX_ITEMS = 50

function load(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as NotificationItem[]) : []
  } catch {
    return []
  }
}

function save(items: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    return
  }
}

interface NotificationsState {
  items: NotificationItem[]
}

const initialState: NotificationsState = { items: load() }

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<NotificationItem>) {
        state.items.unshift(action.payload)
        if (state.items.length > MAX_ITEMS) state.items.length = MAX_ITEMS
        save(state.items)
      },
      prepare(input: { songId: string; title: string; by: string }) {
        return { payload: { id: nanoid(), at: Date.now(), read: false, ...input } }
      },
    },
    markAllRead(state) {
      state.items.forEach((n) => {
        n.read = true
      })
      save(state.items)
    },
    clearNotifications(state) {
      state.items = []
      save(state.items)
    },
  },
})

export const { addNotification, markAllRead, clearNotifications } = notificationsSlice.actions
export default notificationsSlice.reducer
