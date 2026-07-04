import type { Server } from 'node:http'

import { WebSocketServer } from 'ws'
import { z } from 'zod'

import { hub } from './hub'

import { logger } from '~/config/logger'


const presenceUserSchema = z.object({ id: z.string(), email: z.string() })

const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join'), songId: z.uuid(), user: presenceUserSchema.optional() }),
  z.object({ type: z.literal('leave'), songId: z.uuid() }),
])

const ANON: z.infer<typeof presenceUserSchema> = { id: 'anonymous', email: 'anonymous' }

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
        hub.join(ws, msg.songId, msg.user ?? ANON)
      } else {
        hub.leave(ws, msg.songId)
      }
    })

    ws.on('close', () => hub.removeEverywhere(ws))
  })

  logger.info('WebSocket server ready')
  return wss
}
