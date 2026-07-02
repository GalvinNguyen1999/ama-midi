import type { Request, Response, NextFunction } from "express"

import { asyncHandler } from '~/core/asyncHandler'

describe('asyncHandler', () => {
  it('Call next(error) if handler throw error', async () => {
    const req = {} as Request
    const res = {} as Response
    const next = jest.fn() as unknown as NextFunction
    const error = new Error('test')

    const handler = async () => {
      throw error
    }

    await asyncHandler(handler)(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('Call next() if handler resolve', async () => {
    const req = {} as Request
    const res = {} as Response
    const next = jest.fn() as unknown as NextFunction

    const handler = async () => {
      return 'test'
    }

    await asyncHandler(handler)(req, res, next)

    expect(next).not.toHaveBeenCalled()
  })
});
