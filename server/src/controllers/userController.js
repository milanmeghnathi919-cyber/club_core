import userService from '../services/userService.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { ROLE_VALUES, ROLES } from '../config/roles.js'

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const data = await userService.list({ page, limit, search: req.query.search })
  res.json({ success: true, ...data })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id)
  res.json({ success: true, data: user })
})

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body

  if (!ROLE_VALUES.includes(role)) {
    throw ApiError.badRequest('Validation failed', [
      { field: 'role', message: `Must be one of: ${ROLE_VALUES.join(', ')}` },
    ])
  }

  const user = await userService.create({
    name,
    email,
    phone,
    password,
    role,
    // staff accounts are trusted at signup; members verify by email
    isEmailVerified: role !== ROLES.MEMBER,
  })

  res.status(201).json({ success: true, data: user })
})

export const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role, isActive } = req.body

  if (role !== undefined && !ROLE_VALUES.includes(role)) {
    throw ApiError.badRequest('Validation failed', [
      { field: 'role', message: `Must be one of: ${ROLE_VALUES.join(', ')}` },
    ])
  }

  const user = await userService.updateById(req.params.id, { name, phone, role, isActive })
  res.json({ success: true, data: user })
})

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    throw ApiError.badRequest('You cannot delete your own account')
  }
  await userService.remove(req.params.id)
  res.status(204).send()
})