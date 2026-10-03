import multer from 'multer'
import { ZodError } from 'zod'
import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`, 'NOT_FOUND'))
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode ?? 500
  let code = err.code ?? null
  let message = err.message ?? 'Internal server error'
  let details = err.details ?? null
  let warnings = err.warnings ?? undefined

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 422
    code = 'VALIDATION_ERROR'
    message = 'Validation error'
    details = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    statusCode = 422
    code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED'
    message = err.message
  }

  // RPC format "CODE|Message"
  if (typeof err.message === 'string' && err.message.includes('|')) {
    const [rpcCode, rpcMsg] = err.message.split('|')
    code = rpcCode.trim()
    message = rpcMsg ? rpcMsg.trim() : rpcCode.trim()

    const CODE_MAP = {
      SLOT_TAKEN: 409,
      MEMBER_OVERLAP: 409,
      DAILY_LIMIT_REACHED: 422,
      TABLE_OCCUPIED: 409,
      TAB_CLOSED: 409,
      ITEM_UNAVAILABLE: 409,
      OUT_OF_STOCK: 422,
      AMOUNT_MISMATCH: 422,
      CANCEL_WINDOW_PASSED: 422,
      INVALID_SLOT: 422,
      PAST_SLOT: 422,
      SESSION_FULL: 422,
      ALREADY_JOINED: 409,
      PHONE_EXISTS: 409,
      EMAIL_EXISTS: 409,
      JUNIOR_AGE_MISMATCH: 422,
      OVERPAYMENT: 422,
      OVERLAPPING_SHIFT: 409,
      SIGNATURE_INVALID: 400,
    }
    if (CODE_MAP[code]) {
      statusCode = CODE_MAP[code]
    }
  }

  // Postgres native codes
  if (err.code === '23P01') {
    statusCode = 409
    code = 'SLOT_TAKEN'
    message = 'That court slot is already booked'
  } else if (err.code === '23505') {
    statusCode = 409
    code = code || 'DUPLICATE'
    message = message || 'That record already exists'
  }

  if (statusCode >= 500) {
    logger.error(err)
    code = 'INTERNAL_ERROR'
    message = 'Something went wrong on our side'
  }

  const responseBody = {
    success: false,
    error: {
      code: code ?? 'INTERNAL_ERROR',
      message,
      ...(details ? { details } : {}),
    },
  }

  if (warnings) responseBody.warnings = warnings

  res.status(statusCode).json(responseBody)
}

export default {
  notFoundHandler,
  errorHandler,
}