import http from 'node:http'

import { createApp } from './app'
import { connectDb } from './config/db'
import { env } from './config/env'
import { logger } from './config/logger'
import { createWsServer } from './core/realtime/wsServer'

(async () => {
  await connectDb()

  const app = createApp()
  const server = http.createServer(app)
  createWsServer(server)

  server.listen(env.PORT, () => {
    logger.info(`API + WS listening on port ${env.PORT}`)
  })
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
