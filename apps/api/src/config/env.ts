import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development','test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGINS: z.string(),
  FRONTEND_BASE_URL: z.url(),
})

export const env = schema.parse(process.env)
