import multer from 'multer'
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

  

  // multer upload failures (size / count / mime)
  if (err instanceof multer.MulterError) {
    statusCode = 400
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Max ${config.upload.maxFileSizeBytes / (1024 * 1024)}MB allowed`
        : err.message
  }

  // postgres errors; utils/db.js normally translates these to ApiError already
  if (err.code === '23505') {
    statusCode = 409
    message = 'Duplicate record'
  }
  if (err.code === '23503') {
    statusCode = 400
    message = 'Referenced record does not exist'
  }
  if (err.code === '22P02' || err.code === '23514') {
    statusCode = 400
    message = 'Invalid value for one or more fields'
    details = err.message
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