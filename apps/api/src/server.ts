import { createApp } from './app'
import { connectDb } from './config/db'
import { env } from './config/env'
import { logger } from './config/logger'

(async () => {
  await connectDb()

  const app = createApp()
  app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`)
  })
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
