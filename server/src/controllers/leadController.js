import leadService from '../services/leadService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created, paginated } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, source } = req.query
  const { items, total } = await leadService.list({
    page: Number(page),
    limit: Number(limit),
    status,
    source,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const getFollowUps = asyncHandler(async (req, res) => {
  const followUps = await leadService.getFollowUps()
  return ok(res, followUps)
})

export const get = asyncHandler(async (req, res) => {
  const lead = await leadService.get(req.params.id)
  return ok(res, lead)
})

export const create = asyncHandler(async (req, res) => {
  const lead = await leadService.create(req.body, req.user.id)
  return created(res, lead)
})

export const update = asyncHandler(async (req, res) => {
  const updated = await leadService.update(req.params.id, req.body)
  return ok(res, updated)
})

export const addActivity = asyncHandler(async (req, res) => {
  const activity = await leadService.addActivity(req.params.id, req.body, req.user.id)
  return created(res, activity)
})

export const addQuote = asyncHandler(async (req, res) => {
  const quote = await leadService.addQuote(req.params.id, req.body, req.user.id)
  return created(res, quote)
})

export const convert = asyncHandler(async (req, res) => {
  const result = await leadService.convert(req.params.id, req.body, req.user.id)
  return ok(res, result)
})

export default {
  list,
  getFollowUps,
  get,
  create,
  update,
  addActivity,
  addQuote,
  convert,
}
