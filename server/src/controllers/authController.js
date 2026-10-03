import config from '../config/index.js'
import authService from '../services/authService.js'
import asyncHandler from '../utils/asyncHandler.js'

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: COOKIE_MAX_AGE,
  })
}

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body)
  setAuthCookie(res, token)
  res.status(201).json({ success: true, data: { user, token } })
})

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body)
  setAuthCookie(res, token)
  res.json({ success: true, data: { user, token } })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token')
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