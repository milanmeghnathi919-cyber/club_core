/**
 * Application error with an HTTP status and a stable machine-readable code.
 *
 * The `code` is what the frontend switches on; `message` is for humans.
 * Keeping them separate means copy can change without breaking client logic.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null, code = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.code = code ?? DEFAULT_CODES[statusCode] ?? 'INTERNAL_ERROR'
    this.isOperational = true
  }

  static badRequest(message = 'Bad request', details = null, code = 'VALIDATION_ERROR') {
    return new ApiError(400, message, details, code)
  }

  static unauthorized(message = 'Not signed in', code = 'UNAUTHENTICATED') {
    return new ApiError(401, message, null, code)
  }

  static forbidden(message = 'Your role does not have access to this action', code = 'FORBIDDEN') {
    return new ApiError(403, message, null, code)
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, null, code)
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, message, null, code)
  }

  static unprocessable(message = 'Rule failed', details = null, code = 'RULE_FAILED') {
    return new ApiError(422, message, details, code)
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, message, null, code)
  }
}

const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'RULE_FAILED',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
}

export default ApiError