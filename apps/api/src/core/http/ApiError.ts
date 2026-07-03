import { StatusCodes } from 'http-status-codes'

export class ApiError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  static BadRequest(msg = 'Bad Request', details?: unknown) {
    return new ApiError(StatusCodes.BAD_REQUEST, msg, details)
  }

  static NotFound(msg = 'Not Found', details?: unknown) {
    return new ApiError(StatusCodes.NOT_FOUND, msg, details)
  }

  static Conflict(msg = 'Conflict', details?: unknown) {
    return new ApiError(StatusCodes.CONFLICT, msg, details)
  }

  static Forbidden(msg = 'Forbidden', details?: unknown) {
    return new ApiError(StatusCodes.FORBIDDEN, msg, details)
  }
}
