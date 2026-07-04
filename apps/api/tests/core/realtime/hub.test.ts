import type { WebSocket } from 'ws'

import type { PresenceUser, WsServerEvent } from '~/core/realtime/events'
import { hub } from '~/core/realtime/hub'

interface MockWs {
  readyState: number
  send: jest.Mock
}

function mockWs(readyState = 1): MockWs {
  return { readyState, send: jest.fn() }
}

const asWs = (ws: MockWs) => ws as unknown as WebSocket

type Payload = { type: string; songId: string; users?: PresenceUser[]; noteId?: string }

function payloads(ws: MockWs): Payload[] {
  return ws.send.mock.calls.map((c) => JSON.parse(c[0] as string))
}

function lastPayload(ws: MockWs): Payload | undefined {
  const all = payloads(ws)
  return all[all.length - 1]
}

describe('realtime hub', () => {
  it('broadcasts presence to a member when it joins', () => {
    const ws = mockWs()
    hub.join(asWs(ws), 'room1', { id: 'u1', email: 'a@b.com' })
    expect(lastPayload(ws)).toMatchObject({
      type: 'presence',
      songId: 'room1',
      users: [{ id: 'u1', email: 'a@b.com' }],
    })
    hub.removeEverywhere(asWs(ws))
  })

  it('broadcast reaches open sockets only', () => {
    const open = mockWs(1)
    const closed = mockWs(3)
    hub.join(asWs(open), 'room2', { id: 'u1', email: 'a' })
    hub.join(asWs(closed), 'room2', { id: 'u2', email: 'b' })
    open.send.mockClear()
    closed.send.mockClear()

    const event: WsServerEvent = { type: 'note.deleted', songId: 'room2', noteId: 'x', version: 1 }
    hub.broadcast('room2', event)

    expect(open.send).toHaveBeenCalledTimes(1)
    expect(closed.send).not.toHaveBeenCalled()
    hub.removeEverywhere(asWs(open))
    hub.removeEverywhere(asWs(closed))
  })

  it('dedupes presence by user id across sockets', () => {
    const a = mockWs()
    const b = mockWs()
    hub.join(asWs(a), 'room3', { id: 'u1', email: 'a' })
    hub.join(asWs(b), 'room3', { id: 'u1', email: 'a' })
    expect(lastPayload(b)?.users).toHaveLength(1)
    hub.removeEverywhere(asWs(a))
    hub.removeEverywhere(asWs(b))
  })

  it('broadcasts updated presence when a socket leaves', () => {
    const a = mockWs()
    const b = mockWs()
    hub.join(asWs(a), 'room4', { id: 'u1', email: 'a' })
    hub.join(asWs(b), 'room4', { id: 'u2', email: 'b' })
    b.send.mockClear()

    hub.leave(asWs(a), 'room4')
    expect(lastPayload(b)).toMatchObject({ type: 'presence', users: [{ id: 'u2', email: 'b' }] })
    hub.removeEverywhere(asWs(b))
  })

  it('notifyUser reaches every socket subscribed to that user', () => {
    const a = mockWs()
    const b = mockWs()
    hub.subscribeUser(asWs(a), 'user-1')
    hub.subscribeUser(asWs(b), 'user-2')

    hub.notifyUser('user-1', { type: 'invited', songId: 's1', title: 'Song', by: 'o@x.com' })

    expect(a.send).toHaveBeenCalledTimes(1)
    expect(b.send).not.toHaveBeenCalled()
    expect(lastPayload(a)).toMatchObject({ type: 'invited', songId: 's1' })

    hub.removeEverywhere(asWs(a))
    hub.removeEverywhere(asWs(b))
  })

  it('notifyUser is a no-op after the user disconnects', () => {
    const a = mockWs()
    hub.subscribeUser(asWs(a), 'user-3')
    hub.removeEverywhere(asWs(a))
    a.send.mockClear()

    hub.notifyUser('user-3', { type: 'invited', songId: 's1', title: 'Song', by: 'o@x.com' })
    expect(a.send).not.toHaveBeenCalled()
  })

  it('removeEverywhere drops the socket from all its rooms', () => {
    const a = mockWs()
    const b = mockWs()
    hub.join(asWs(a), 'room5', { id: 'u1', email: 'a' })
    hub.join(asWs(b), 'room5', { id: 'u2', email: 'b' })
    b.send.mockClear()

    hub.removeEverywhere(asWs(a))
    expect(lastPayload(b)?.users).toEqual([{ id: 'u2', email: 'b' }])
    hub.removeEverywhere(asWs(b))
  })
})
