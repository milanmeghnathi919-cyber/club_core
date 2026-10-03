import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { queryOne } from '../utils/db.js'
import { ROLES, STAFF, FD_PLUS, OWNER_ONLY, ANY_AUTH, COURT_STAFF, SHOP_STAFF, CAFE_STAFF } from '../config/roles.js'
import userRepository from '../repositories/userRepository.js'

export const COOKIE_NAME = 'cc_token'

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const token = bearer ?? req.cookies?.[COOKIE_NAME]

  if (!token) throw ApiError.unauthorized('Not signed in', 'UNAUTHENTICATED')

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Invalid session',
      'UNAUTHENTICATED'
    )
  }

  const userId = payload.sub ?? payload.id
  let row = await userRepository.findById(userId)

  if (!row) {
    try {
      row = await queryOne(
        'select id, role, is_active, name, email, phone from public.users where id = $1',
        [userId],
      )
    } catch {
      // fallback
    }
  }

  if (!row) throw ApiError.unauthorized('Account no longer exists', 'UNAUTHENTICATED')
  if (row.is_active === false) throw ApiError.forbidden('This account has been disabled', 'FORBIDDEN')

  req.user = {
    ...payload,
    id: row.id,
    sub: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
  }

  next()
})

export const requireAuth = authenticate

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const token = bearer ?? req.cookies?.[COOKIE_NAME]

  if (!token) return next()

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret || 'dev-secret-key-12345')
  } catch {
    return next()
  }

  const userId = payload.sub ?? payload.id
  let row = await userRepository.findById(userId)

  if (!row) {
    try {
      row = await queryOne(
        'select id, role, is_active, name, email, phone from public.users where id = $1',
        [userId],
      )
    } catch {}
  }

  if (row && row.is_active !== false) {
    req.user = {
      ...payload,
      id: row.id,
      sub: row.id,
      role: row.role,
      name: row.name,
      email: row.email,
      phone: row.phone,
    }
  }

  next()
})

/**
 * Expand roles and shorthands:
 *   'staff' -> owner, front_desk, bar_staff
 *   'FD+'   -> owner, front_desk
 *   'owner' -> owner
 *   'any'   -> any authenticated user
 */
export const authorize = (...roles) => {
  const expanded = new Set()

  for (const r of roles.flat()) {
    if (r === 'staff') {
      STAFF.forEach((item) => expanded.add(item))
    } else if (r === 'court' || r === 'court_staff' || r === 'FD+' || r === 'fd+' || r === 'FD_PLUS') {
      COURT_STAFF.forEach((item) => expanded.add(item))
    } else if (r === 'shop' || r === 'shop_staff') {
      SHOP_STAFF.forEach((item) => expanded.add(item))
    } else if (r === 'cafe' || r === 'cafe_staff' || r === 'bar' || r === 'bar_staff') {
      CAFE_STAFF.forEach((item) => expanded.add(item))
    } else if (r === 'owner') {
      OWNER_ONLY.forEach((item) => expanded.add(item))
    } else if (r === 'any' || r === '*') {
      ANY_AUTH.forEach((item) => expanded.add(item))
    } else {
      expanded.add(r)
    }
  }

  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Not signed in', 'UNAUTHENTICATED'))
    if (expanded.size > 0 && !expanded.has(req.user.role)) {
      return next(ApiError.forbidden('Your role does not have access to this action', 'FORBIDDEN'))
    }
    next()
  }
}

export const requireRole = authorize
export const staffOnly = authorize('staff')
export const fdPlusOnly = authorize('FD+')
export const ownerOnly = authorize('owner')
export const adminOnly = ownerOnly
export const managerOnly = fdPlusOnly

export default {
  authenticate,
  requireAuth,
  optionalAuth,
  authorize,
  requireRole,
  staffOnly,
  fdPlusOnly,
  ownerOnly,
  COOKIE_NAME,
}