import cors, { CorsOptions } from 'cors'

import { env } from '~/config/env'

const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim())

const corsOptions: CorsOptions = {
  origin(origin, callback) {

    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  optionsSuccessStatus: 204,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
}

export const corsMiddleware = cors(corsOptions)
