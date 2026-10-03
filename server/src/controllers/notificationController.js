import notificationService from '../services/notificationService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser(req.user.id)
  return ok(res, result.notifications, { unreadCount: result.unreadCount })
})

export const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(req.params.id)
  return ok(res, result)
})

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id)
  return ok(res, result)
})

export default {
  list,
  markRead,
  markAllRead,
}
