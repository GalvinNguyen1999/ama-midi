import { Request, Response, NextFunction } from 'express'

import { ApiError } from '~/core/http/ApiError'
import { errorHandler } from '~/core/http/errorHandler'

describe('errorHandler', () => {
  it('Should return status, message and details if error is ApiError', async () => {
    const req = {} as Request
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response
    const next = jest.fn() as unknown as NextFunction

    const error = ApiError.BadRequest('Invalid data', { field: 'name' })

    await errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid data',
      details: { field: 'name' }
    })
  })

  it('Should return status, message and details if error is not ApiError', async () => {
    const req = {} as Request
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response
    const next = jest.fn() as unknown as NextFunction

    const error = new Error('Something went wrong')

    await errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal Server Error'
    })
  })
})
