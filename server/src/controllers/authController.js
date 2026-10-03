import config from '../config/index.js'
import authService from '../services/authService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { COOKIE_NAME } from '../middlewares/auth.js'
import { ok, created } from '../utils/response.js'

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: config.env === 'production' ? 'none' : 'lax',
    secure: config.cookieSecure || config.env === 'production',
    maxAge: COOKIE_MAX_AGE,
  })
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body)
  setAuthCookie(res, result.token)
  return created(res, result)
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  setAuthCookie(res, result.token)
  return ok(res, result)
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: config.env === 'production' ? 'none' : 'lax',
    secure: config.cookieSecure || config.env === 'production',
  })
  return ok(res, {})
})

export const me = asyncHandler(async (req, res) => {
  const result = await authService.me(req.user.id || req.user.sub)
  return ok(res, result)
})

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id || req.user.sub, req.body)
  return ok(res, {})
})

export const forgotPassword = asyncHandler(async (req, res) => {
  return ok(res, {})
})

export const resetPassword = asyncHandler(async (req, res) => {
  return ok(res, {})
})

export default {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
}