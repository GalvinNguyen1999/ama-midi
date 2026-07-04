import type { Server } from 'node:http'

import { WebSocketServer } from 'ws'
import { z } from 'zod'

import { hub } from './hub'

import { logger } from '~/config/logger'


const presenceUserSchema = z.object({ id: z.string(), email: z.string() })

const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join'), songId: z.uuid(), user: presenceUserSchema.optional() }),
  z.object({ type: z.literal('leave'), songId: z.uuid() }),
  z.object({ type: z.literal('subscribe'), userId: z.string().min(1) }),
  z.object({
    type: z.literal('cursor'),
    songId: z.uuid(),
    user: presenceUserSchema,
    track: z.number().nullable(),
    time: z.number().nullable(),
  }),
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

      switch (msg.type) {
        case 'join':
          hub.join(ws, msg.songId, msg.user ?? ANON)
          break

        case 'leave':
          hub.leave(ws, msg.songId)
          break

        case 'cursor':
          hub.relayCursor(ws, msg.songId, {
            type: 'cursor',
            songId: msg.songId,
            user: msg.user,
            track: msg.track,
            time: msg.time,
          })
          break

        case 'subscribe':
          hub.subscribeUser(ws, msg.userId)
          break
      }
    })

    ws.on('close', () => hub.removeEverywhere(ws))
  })

  logger.info('WebSocket server ready')
  return wss
}
