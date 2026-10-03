import authService from '../services/authService.js'
import asyncHandler from '../utils/asyncHandler.js'

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body)

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_MAX_AGE,
  })

  res.status(201).json({ success: true, data: { user, token } })
})

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body)

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_MAX_AGE,
  })

  res.json({ success: true, data: { user, token } })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token')
  res.json({ success: true, data: null })
})