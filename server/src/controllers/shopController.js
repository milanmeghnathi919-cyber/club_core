import shopService from '../services/shopService.js'
import memberRepository from '../repositories/memberRepository.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { ok, created, paginated } from '../utils/response.js'
import { ANY_STAFF } from '../config/roles.js'

export const quote = asyncHandler(async (req, res) => {
  let memberId = null
  if (req.user && req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (member) memberId = member.id
  } else if (req.user && ANY_STAFF.includes(req.user.role)) {
    memberId = req.body.memberId || null
  }

  const result = await shopService.quote({
    items: req.body.items,
    memberId,
    fulfilment: req.body.fulfilment,
  })
  return ok(res, result)
})

export const create = asyncHandler(async (req, res) => {
  const isStaff = ANY_STAFF.includes(req.user.role)
  let memberId = req.body.memberId || null
  let channel = isStaff ? 'counter' : 'online'

  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member) throw ApiError.notFound('Member profile not found', 'NOT_FOUND')
    memberId = member.id
  }

  const order = await shopService.create({
    ...req.body,
    channel,
    memberId,
    actorId: req.user.id,
  })
  return created(res, order)
})

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, memberId, status } = req.query
  const { items, total } = await shopService.list({
    page: Number(page),
    limit: Number(limit),
    memberId,
    status,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const mine = asyncHandler(async (req, res) => {
  let member = await memberRepository.findByUserId(req.user.id)
  if (!member && req.user.email) {
    member = await memberRepository.findByEmail(req.user.email)
  }

  const { page = 1, limit = 50, status } = req.query
  const { items, total } = await shopService.list({
    page: Number(page),
    limit: Number(limit),
    memberId: member?.id || null,
    createdBy: req.user.id,
    status,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const get = asyncHandler(async (req, res) => {
  const order = await shopService.get(req.params.id)
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || order.member_id !== member.id) {
      throw ApiError.forbidden('You can only view your own orders', 'FORBIDDEN')
    }
  }
  return ok(res, order)
})

export const updateStatus = asyncHandler(async (req, res) => {
  const updated = await shopService.updateStatus(req.params.id, req.body.status, req.user.id)
  return ok(res, updated)
})

export const pay = asyncHandler(async (req, res) => {
  const updated = await shopService.pay(req.params.id, {
    method: req.body.method,
    actorId: req.user.id,
  })
  return ok(res, updated)
})

export const cancel = asyncHandler(async (req, res) => {
  const isStaff = ANY_STAFF.includes(req.user.role)
  const order = await shopService.get(req.params.id)

  if (!isStaff && req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || order.member_id !== member.id) {
      throw ApiError.forbidden('You can only cancel your own orders', 'FORBIDDEN')
    }
  }

  const cancelled = await shopService.cancel(req.params.id, req.user.id, isStaff)
  return ok(res, cancelled)
})

export default {
  quote,
  create,
  list,
  mine,
  get,
  updateStatus,
  pay,
  cancel,
}
