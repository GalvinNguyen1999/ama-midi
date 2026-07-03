import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development','test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(1).default('dev-access-secret-change-me'),
  REFRESH_TOKEN_SECRET: z.string().min(1).default('dev-refresh-secret-change-me'),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGINS: z.string(),
  FRONTEND_BASE_URL: z.url(),
})

export const env = schema.parse(process.env)
