import plansService from '../services/plansService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'
import { ANY_STAFF } from '../config/roles.js'

export const list = asyncHandler(async (req, res) => {
  const isStaff = req.user ? ANY_STAFF.includes(req.user.role) : false
  const plans = await plansService.list(isStaff)
  return ok(res, plans)
})

export const get = asyncHandler(async (req, res) => {
  const plan = await plansService.get(req.params.id)
  return ok(res, plan)
})

export const create = asyncHandler(async (req, res) => {
  const plan = await plansService.create(req.body)
  return created(res, plan)
})

export const update = asyncHandler(async (req, res) => {
  const plan = await plansService.update(req.params.id, req.body)
  return ok(res, plan)
})

export default {
  list,
  get,
  create,
  update,
}
