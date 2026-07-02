import Expess from 'express'
import request from 'supertest'

import { createApp } from '~/app'
import { ApiError } from '~/core/http/ApiError'

describe('create app', () => {
  let app = Expess()

  beforeEach(() => {
    app = createApp()
  })

  it('/health should return 200', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('Check headers', async () => {
    const response = await request(app).get('/health')

    expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate')
    expect(response.headers['pragma']).toBe('no-cache')
    expect(response.headers['expires']).toBe('0')
  })

  it('check throw error', async () => {
    app.get('/throw-error', (_req, _res) => {
      throw ApiError.BadRequest()
    })

    const response = await request(app).get('/throw-error')

    expect(response.status).toBe(400)
    expect(response.statusCode).toBe(400)
    expect(response.ok).toBe(false)
  })
})
