import paymentsService from '../services/paymentsService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, paginated } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, from, to, method, sourceType, revenueCategory } = req.query
  const { items, total } = await paymentsService.list({
    page: Number(page),
    limit: Number(limit),
    from,
    to,
    method,
    sourceType,
    revenueCategory,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const refund = asyncHandler(async (req, res) => {
  const { id } = req.params
  const payment = await paymentsService.refund(id, req.user?.id)
  return ok(res, payment)
})

export const verifyRazorpay = asyncHandler(async (req, res) => {
  const result = await paymentsService.verifyRazorpay(req.body)
  return ok(res, result)
})

export default {
  list,
  refund,
  verifyRazorpay,
}