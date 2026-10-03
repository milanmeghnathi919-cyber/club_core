import multer from 'multer'
import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'
import config from '../config/index.js'

/** eslint-disable-next-line no-unused-vars */
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}

/**
 * Single place that turns anything thrown anywhere into the contract envelope:
 *   { success: false, error: { code, message, details? }, warnings? }
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode ?? 500
  let code = err.code ?? null
  let message = err.message ?? 'Internal server error'
  let details = err.details ?? null

  // multer upload failures (size / count / mime)
  if (err instanceof multer.MulterError) {
    statusCode = 400
    code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED'
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Max ${Math.round(config.upload.maxFileSizeBytes / (1024 * 1024))}MB allowed`
        : err.message
  }

  // postgres errors — utils/db.js already maps most of these to ApiError,
  // these cover anything thrown outside a repository
  if (!err.isOperational) {
    if (err.code === '23505') {
      statusCode = 409
      code = 'DUPLICATE'
      message = 'That record already exists'
    } else if (err.code === '23503') {
      statusCode = 400
      code = 'INVALID_REFERENCE'
      message = 'A referenced record does not exist'
    } else if (err.code === '22P02' || err.code === '23514') {
      statusCode = 400
      code = 'INVALID_VALUE'
      message = 'One or more values are not valid'
      details = err.message
    }
  }

  if (statusCode >= 500) {
    logger.error(err)
    code = 'INTERNAL_ERROR'
    message = 'Something went wrong on our side'
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: code ?? 'INTERNAL_ERROR',
      message,
      ...(details && { details }),
    },
    // never leak a stack in production
    ...(config.env === 'development' && statusCode >= 500 && { stack: err.stack }),
  })
}