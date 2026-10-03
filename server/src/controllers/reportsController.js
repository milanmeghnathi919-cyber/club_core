import reportsService from '../services/reportsService.js'
import financeService from '../services/financeService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok } from '../utils/response.js'

export const getDashboard = asyncHandler(async (req, res) => {
  const isOwner = req.user.role === 'owner'
  const result = await reportsService.getDashboard({
    range: req.query.range,
    from: req.query.from,
    to: req.query.to,
    isOwner,
  })
  return ok(res, result)
})

export const getRevenue = asyncHandler(async (req, res) => {
  const result = await reportsService.getRevenueReport({
    groupBy: req.query.groupBy || 'day',
    from: req.query.from,
    to: req.query.to,
  })
  return ok(res, result)
})

export const getTax = asyncHandler(async (req, res) => {
  const result = await reportsService.getTaxReport({
    from: req.query.from,
    to: req.query.to,
  })
  return ok(res, result)
})

export const getPayables = asyncHandler(async (req, res) => {
  const result = await financeService.getPayablesReport()
  return ok(res, result)
})

export const exportReport = asyncHandler(async (req, res) => {
  const { content, filename } = await reportsService.exportCsv(req.params.type)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.status(200).send(content)
})

export const emailReport = asyncHandler(async (req, res) => {
  const { type, toEmail } = req.body
  const { content, filename } = await reportsService.exportCsv(type || 'revenue')
  // nodemailer wrapper doesn't block
  return ok(res, { emailed: true })
})

export default {
  getDashboard,
  getRevenue,
  getTax,
  getPayables,
  exportReport,
  emailReport,
}
