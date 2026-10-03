import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'
import config from '../config/index.js'

// eslint-disable-next-line no-unused-vars
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode ?? 500
  let message = err.message ?? 'Internal server error'
  let details = err.details ?? null

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed'
    details = Object.values(err.errors).map((e) => e.message)
  }

  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}`
  }

  if (err.code === 11000) {
    statusCode = 409
    message = `Duplicate field: ${Object.keys(err.keyValue).join(', ')}`
  }

  if (statusCode >= 500) {
    logger.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(config.env === 'development' && { stack: err.stack }),
  })
}