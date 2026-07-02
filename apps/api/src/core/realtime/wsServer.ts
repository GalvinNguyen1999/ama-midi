import type { Server } from 'node:http'

import { WebSocketServer } from 'ws'
import { z } from 'zod'

import { hub } from './hub'

import { logger } from '~/config/logger'


const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join'), songId: z.string().uuid() }),
  z.object({ type: z.literal('leave'), songId: z.string().uuid() }),
])

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let json: unknown

      try {
        json = JSON.parse(raw.toString())
      } catch {
        return
      }

      const parsed = clientMessageSchema.safeParse(json)
      if (!parsed.success) return

      const msg = parsed.data

      if (msg.type === 'join') {
        hub.join(ws, msg.songId)
      } else {
        hub.leave(ws, msg.songId)
      }
    })

    ws.on('close', () => hub.removeEverywhere(ws))
  })

  logger.info('WebSocket server ready')
  return wss
}
