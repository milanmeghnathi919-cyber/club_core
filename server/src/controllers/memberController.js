import memberService from '../services/memberService.js'
import membershipService from '../services/membershipService.js'
import memberRepository from '../repositories/memberRepository.js'
import planRepository from '../repositories/planRepository.js'
import { createOrder, isRazorpayEnabled } from '../utils/razorpay.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { ok, created, paginated } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, planId } = req.query
  const { items, total } = await memberService.list({
    page: Number(page),
    limit: Number(limit),
    search,
    status,
    planId,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const lookup = asyncHandler(async (req, res) => {
  const results = await memberService.lookup(req.query.q)
  return ok(res, results)
})

export const get = asyncHandler(async (req, res) => {
  const { id } = req.params
  // If member role, ensure they are reading own profile
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || member.id !== id) {
      throw ApiError.forbidden('You can only access your own profile', 'FORBIDDEN')
    }
  }

  const result = await memberService.get(id)
  return ok(res, result)
})

export const create = asyncHandler(async (req, res) => {
  const result = await memberService.create(req.body, req.user?.id)
  return created(res, result)
})

export const update = asyncHandler(async (req, res) => {
  const result = await memberService.update(req.params.id, req.body)
  return ok(res, result)
})

export const history = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || member.id !== id) {
      throw ApiError.forbidden('You can only access your own history', 'FORBIDDEN')
    }
  }

  const { page = 1, limit = 20, type } = req.query
  const { items, total } = await memberService.getHistory(id, {
    page: Number(page),
    limit: Number(limit),
    type,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const assignMembership = asyncHandler(async (req, res) => {
  const { planId, startDate, paymentMethod } = req.body
  const membership = await membershipService.assignPlan(req.params.id, planId, {
    startDate,
    paymentMethod: paymentMethod || 'cash',
    actorId: req.user?.id,
  })
  return created(res, membership)
})

export const cancelMembership = asyncHandler(async (req, res) => {
  const result = await membershipService.cancel(req.params.id, req.user?.id)
  return ok(res, result)
})

export const purchaseMembership = asyncHandler(async (req, res) => {
  const { planId } = req.body
  const member = await memberRepository.findByUserId(req.user.id)
  if (!member) throw ApiError.notFound('Member profile not found', 'NOT_FOUND')

  const plan = await planRepository.findById(planId)
  if (!plan) throw ApiError.notFound('Plan not found', 'NOT_FOUND')

  let razorpayOrder = null
  if (isRazorpayEnabled() && Number(plan.price) > 0) {
    try {
      razorpayOrder = await createOrder({
        amount: Number(plan.price),
        receipt: `mem_${member.id.slice(0, 8)}`,
      })
    } catch {}
  }

  const membership = await membershipService.assignPlan(member.id, plan.id, {
    paymentMethod: 'online',
    actorId: req.user.id,
  })

  return ok(res, {
    membership,
    razorpayOrderId: razorpayOrder?.id || null,
    amount: Number(plan.price),
    currency: 'INR',
  })
})

export const deleteMember = asyncHandler(async (req, res) => {
  const result = await memberService.delete(req.params.id)
  return ok(res, result)
})

export default {
  list,
  lookup,
  get,
  create,
  update,
  history,
  assignMembership,
  cancelMembership,
  purchaseMembership,
  deleteMember,
}