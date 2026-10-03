import courtService from '../services/courtService.js'
import availabilityService from '../services/availabilityService.js'
import memberRepository from '../repositories/memberRepository.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'
import { ANY_STAFF } from '../config/roles.js'

export const list = asyncHandler(async (req, res) => {
  const isStaff = req.user ? ANY_STAFF.includes(req.user.role) : false
  const courts = await courtService.list({
    includeInactive: isStaff && req.query.includeInactive === 'true',
    sport: req.query.sport,
  })
  return ok(res, courts)
})

export const get = asyncHandler(async (req, res) => {
  const court = await courtService.get(req.params.id)
  return ok(res, court)
})

export const create = asyncHandler(async (req, res) => {
  const court = await courtService.create(req.body)
  return created(res, court)
})

export const update = asyncHandler(async (req, res) => {
  const court = await courtService.update(req.params.id, req.body)
  return ok(res, court)
})

export const getAvailability = asyncHandler(async (req, res) => {
  const isStaff = req.user ? ANY_STAFF.includes(req.user.role) : false
  let memberId = req.query.memberId || null

  if (req.user && req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (member) memberId = member.id
  }

  const result = await availabilityService.getAvailability({
    date: req.query.date,
    sport: req.query.sport,
    courtId: req.query.courtId,
    memberId,
    isStaff,
  })

  return ok(res, result)
})

export default {
  list,
  get,
  create,
  update,
  getAvailability,
}
