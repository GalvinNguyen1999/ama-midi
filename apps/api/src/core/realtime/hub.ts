import { WebSocket } from 'ws'

import type { PresenceUser, WsServerEvent } from './events'

const rooms = new Map<string, Map<WebSocket, PresenceUser>>()

function presenceUsers(songId: string): PresenceUser[] {
  const members = rooms.get(songId)

  if (!members) return []

  const unique = new Map<string, PresenceUser>()
  for (const user of members.values()) unique.set(user.id, user)

  return [...unique.values()]
}

function send(ws: WebSocket, payload: string) {
  if (ws.readyState === WebSocket.OPEN) ws.send(payload)
}

export const hub = {
  broadcast(songId: string, event: WsServerEvent) {
    const members = rooms.get(songId)

    if (!members) return

    const payload = JSON.stringify(event)
    for (const ws of members.keys()) send(ws, payload)
  },

  broadcastPresence(songId: string) {
    this.broadcast(songId, { type: 'presence', songId, users: presenceUsers(songId) })
  },

  join(ws: WebSocket, songId: string, user: PresenceUser) {
    let members = rooms.get(songId)

    if (!members) {
      members = new Map()
      rooms.set(songId, members)
    }

    members.set(ws, user)
    this.broadcastPresence(songId)
  },

  leave(ws: WebSocket, songId: string) {
    const members = rooms.get(songId)

    if (!members?.delete(ws)) return

    this.broadcastPresence(songId)
  },

  removeEverywhere(ws: WebSocket) {
    for (const [songId, members] of rooms) {
      if (members.delete(ws)) this.broadcastPresence(songId)
    }
  },
}
