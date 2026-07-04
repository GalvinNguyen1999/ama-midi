import reducer, {
  addNotification,
  clearNotifications,
  markAllRead,
} from '~/store/notificationsSlice'

describe('notificationsSlice', () => {
  it('prepends a new unread notification', () => {
    const state = reducer(undefined, addNotification({ songId: 's1', title: 'Song', by: 'o@x.com' }))
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toMatchObject({ songId: 's1', title: 'Song', read: false })
  })

  it('marks all as read', () => {
    let state = reducer(undefined, addNotification({ songId: 's1', title: 'A', by: 'o@x.com' }))
    state = reducer(state, addNotification({ songId: 's2', title: 'B', by: 'o@x.com' }))
    state = reducer(state, markAllRead())
    expect(state.items.every((n) => n.read)).toBe(true)
  })

  it('clears all notifications', () => {
    let state = reducer(undefined, addNotification({ songId: 's1', title: 'A', by: 'o@x.com' }))
    state = reducer(state, clearNotifications())
    expect(state.items).toHaveLength(0)
  })
})
