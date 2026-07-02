import { WebSocket } from 'ws'

import type { WsServerEvent } from './events'

const rooms = new Map<string, Set<WebSocket>>()

export const hub = {
  join(ws: WebSocket, songId: string) {
    let set = rooms.get(songId)

    if (!set) {
      set = new Set()
      rooms.set(songId, set)
    }

    set.add(ws)
  },

  leave(ws: WebSocket, songId: string) {
    rooms.get(songId)?.delete(ws)
  },

  removeEverywhere(ws: WebSocket) {
    for (const set of rooms.values()) set.delete(ws)
  },

  broadcast(songId: string, event: WsServerEvent) {
    const set = rooms.get(songId)

    if (!set) return

    const payload = JSON.stringify(event)
    
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload)
    }
  },
}
