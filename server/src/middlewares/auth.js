import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) throw ApiError.unauthorized('Missing bearer token')

  try {
    req.user = jwt.verify(token, config.jwtSecret)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }

  next()
})

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'))
    }
    next()
  }