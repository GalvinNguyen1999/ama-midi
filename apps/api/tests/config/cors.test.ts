import express from "express"
import { StatusCodes } from 'http-status-codes'
import request from 'supertest'

import { corsMiddleware } from "~/config/cors"

describe('cors', () => {
  const createdApp = () => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/test-cors', (_req, res) => {
      res.json({ oke: true })
    })
    return app
  }

  it('should return 200 when origin is allowed', async () => {
    const allowedOrigins = 'http://localhost:5173'
    const app = createdApp()
    const response = await request(app).get('/test-cors').set('Origin', allowedOrigins)
    expect(response.status).toBe(StatusCodes.OK)
    expect(response.body).toEqual({ oke: true })
  })

  it('should return 403 when origin is not allowed', async () => {
    const notAllowedOrigins = 'http://xxx:5173'
    const app = createdApp()
    const response = await request(app).get('/test-cors').set('Origin', notAllowedOrigins)
    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(response.ok).toBe(false)
    expect(JSON.stringify(response.error)).toContain(`Error: Origin ${notAllowedOrigins} not allowed by CORS`)
  })

  it('allow request without origin', async () => {
    const app = createdApp()
    const response = await request(app).get('/test-cors')
    expect(response.status).toBe(StatusCodes.OK)
  })
})
