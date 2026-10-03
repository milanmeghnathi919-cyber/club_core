import paymentService from '../services/paymentService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const createOrder = asyncHandler(async (req, res) => {
  const { amount, receipt, notes } = req.body
  const order = await paymentService.createRazorpayOrder({ amount, receipt, notes })
  res.status(201).json({ success: true, data: order })
})

export const verifyPayment = asyncHandler(async (req, res) => {
  await paymentService.verifyRazorpayPayment(req.body)
  res.json({ success: true, data: { verified: true } })
})

export const recordCashPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.record({ ...req.body, receivedBy: req.user.sub })
  res.status(201).json({ success: true, data: payment })
})

export const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const data = await paymentService.list({ page, limit, revenueCategory: req.query.category })
  res.json({ success: true, ...data })
})

export const revenueSummary = asyncHandler(async (req, res) => {
  const to = req.query.to ?? new Date().toISOString()
  const from = req.query.from ?? new Date(Date.now() - 30 * 864e5).toISOString()
  const summary = await paymentService.revenueSummary({ from, to })
  res.json({ success: true, data: { from, to, summary } })
})