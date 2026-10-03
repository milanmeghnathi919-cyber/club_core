import config from '../config/index.js'
import authService from '../services/authService.js'
import emailVerificationService from '../services/emailVerificationService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { COOKIE_NAME } from '../middlewares/auth.js'

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: COOKIE_MAX_AGE,
  })
}

/**
 * Register, then immediately fire a verification code.
 *
 * The code send is not awaited into the response: a slow or broken mail server
 * must not stop someone getting their account. If the send fails the user can
 * request another code.
 */
export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body)
  setAuthCookie(res, token)

  let emailCodeSent = false
  try {
    const result = await emailVerificationService.requestCode(user.id)
    emailCodeSent = result.sent
  } catch {
    emailCodeSent = false
  }

  res.status(201).json({
    success: true,
    data: { user, token, emailCodeSent },
  })
})

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body)
  setAuthCookie(res, token)

  res.json({
    success: true,
    data: {
      user,
      token,
      // the client uses this to route straight to the verification screen
      needsEmailVerification: !user.is_email_verified,
    },
  })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ success: true, data: null })
})

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.sub)
  res.json({ success: true, data: user })
})

export const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user.sub, req.body)
  res.json({ success: true, data: user })
})