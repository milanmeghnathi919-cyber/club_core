import userService from '../services/userService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)

  const data = await userService.list({ page, limit })
  res.json({ success: true, ...data })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id)
  res.json({ success: true, data: user })
})

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id)
  res.status(204).send()
})