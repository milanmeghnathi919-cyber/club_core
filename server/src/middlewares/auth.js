import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { queryOne } from '../utils/db.js'
import { ANY_STAFF, MANAGERS, ROLES } from '../config/roles.js'

export const COOKIE_NAME = 'cc_token'

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const token = bearer ?? req.cookies?.[COOKIE_NAME]

  if (!token) throw ApiError.unauthorized('Not signed in')

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Invalid session',
    )
  }

  req.user = payload

  // Fresh read rather than trusting the token, so a deactivated or
  // demoted account loses access immediately instead of at token expiry.
  const row = await queryOne(
    'select id, role, is_active, is_email_verified from public.users where id = $1',
    [payload.sub],
  )

  if (!row) throw ApiError.unauthorized('Account no longer exists')
  if (!row.is_active) throw ApiError.forbidden('This account has been disabled')

  req.user.role = row.role
  req.user.emailVerified = row.is_email_verified

  next()
})

/**
 * Gate for member-only actions. Managers and admins pass without verifying,
 * since staff accounts are created by the club and are trusted at signup.
 */
export const requireVerifiedEmail = (req, res, next) => {
  const isStaff = ANY_STAFF.includes(req.user.role)
  if (isStaff || req.user.emailVerified) return next()

  next(
    new ApiError(403, 'Verify your email address to continue', [
      { field: 'email', message: 'Email not verified. Request a code and confirm it first.' },
    ]),
  )
}

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Your role does not have access to this action'))
    }
    next()
  }

/** Any staff member, any area. */
export const staffOnly = authorize(...ANY_STAFF)

/** Area managers only — no plain staff tier exists in this role set. */
export const managerOnly = authorize(...MANAGERS, ROLES.ADMIN)

/** Admin only — finance, HR, settings, staff accounts. */
export const adminOnly = authorize(ROLES.ADMIN)

export default {
  authenticate,
  authorize,
  requireVerifiedEmail,
  staffOnly,
  managerOnly,
  adminOnly,
  COOKIE_NAME,
}