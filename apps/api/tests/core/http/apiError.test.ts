import { StatusCodes } from 'http-status-codes'

import { ApiError } from '~/core/http/ApiError'

describe('ApiError', () => {
  it('Should create instance with statusCode, message and details', () => {
    const error = new ApiError(400, 'Bad Request', { field: 'name' })

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Bad Request')
    expect(error.details).toEqual({ field: 'name' })
  })

  it('Should be instance of ApiError and Error', () => {
    const error = new ApiError(400, 'Bad Request', { field: 'name' })
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)
  })

  it('Should have stack trace', () => {
    const error = new ApiError(StatusCodes.GONE, 'Gone')
    expect(typeof error.stack).toBe('string')
    expect(error.stack).toContain('ApiError')
  })

  it('Should return default statusCode, message and details if not provided', () => {
    const error = ApiError.BadRequest()

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Bad Request')
    expect(error.details).toBeUndefined()
  })

  it('Should return statusCode, message and details if provided', () => {
    const customMessage = 'Invalid data'
    const customDetails = { field: 'name' }

    const error = ApiError.BadRequest(customMessage, customDetails)

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe(customMessage)
    expect(error.details).toEqual(customDetails)
  })
})
