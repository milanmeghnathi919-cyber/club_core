import bookingService from '../services/bookingService.js'
import memberRepository from '../repositories/memberRepository.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { ok, created, paginated } from '../utils/response.js'
import { ANY_STAFF } from '../config/roles.js'

export const create = asyncHandler(async (req, res) => {
  const isStaff = ANY_STAFF.includes(req.user.role)
  let memberId = req.body.memberId || null
  let source = isStaff ? 'staff_counter' : 'member_web'

  let guestName = req.body.guestName || req.body.guest?.name || null
  let guestPhone = req.body.guestPhone || req.body.guest?.phone || null

  // If memberId is not explicitly provided and this is not a guest booking:
  if (!memberId && !guestName) {
    let member = await memberRepository.findByUserId(req.user.id)
    if (!member && req.user.email) {
      member = await memberRepository.findByEmail(req.user.email)
    }
    if (member) {
      memberId = member.id
    } else {
      // Auto-create member profile for the authenticated user if missing
      try {
        const { nextMemberCode } = await import('../utils/numbering.js')
        const code = await nextMemberCode()
        member = await memberRepository.create({
          memberCode: code,
          userId: req.user.id,
          fullName: req.user.name || 'Club Member',
          phone: req.user.phone || 'Not Provided',
          email: req.user.email,
        })
        if (member) memberId = member.id
      } catch {}
    }
  }

  const booking = await bookingService.create({
    ...req.body,
    memberId,
    guestName,
    guestPhone,
    source,
    actorId: req.user.id,
  })

  return created(res, booking)
})

export const list = asyncHandler(async (req, res) => {
  let memberId = req.query.memberId
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member) throw ApiError.notFound('Member profile not found', 'NOT_FOUND')
    memberId = member.id
  }
  const { page = 1, limit = 50, date, courtId, status } = req.query
  const { items, total } = await bookingService.list({
    page: Number(page),
    limit: Number(limit),
    date,
    courtId,
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
  const { page = 1, limit = 50, status, upcoming } = req.query
  const isUpcoming = upcoming === 'true' || upcoming === true

  const { items, total } = await bookingService.list({
    page: Number(page),
    limit: Number(limit),
    userId: req.user.id,
    userEmail: req.user.email,
    status,
    upcoming: isUpcoming,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const get = asyncHandler(async (req, res) => {
  const booking = await bookingService.get(req.params.id)
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || booking.member_id !== member.id) {
      throw ApiError.forbidden('You can only view your own booking', 'FORBIDDEN')
    }
  }
  return ok(res, booking)
})

export const cancel = asyncHandler(async (req, res) => {
  const isStaff = ANY_STAFF.includes(req.user.role)
  const booking = await bookingService.get(req.params.id)

  if (!isStaff && req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (!member || booking.member_id !== member.id) {
      throw ApiError.forbidden('You can only cancel your own booking', 'FORBIDDEN')
    }
  }

  const cancelled = await bookingService.cancel(req.params.id, {
    actorId: req.user.id,
    isStaff,
    reason: req.body.reason,
  })

  return ok(res, cancelled)
})

export const pay = asyncHandler(async (req, res) => {
  const updated = await bookingService.pay(req.params.id, {
    method: req.body.method,
    actorId: req.user.id,
  })
  return ok(res, updated)
})

export const updateStatus = asyncHandler(async (req, res) => {
  const updated = await bookingService.updateStatus(req.params.id, req.body.status)
  return ok(res, updated)
})

export default {
  create,
  list,
  mine,
  get,
  cancel,
  pay,
  updateStatus,
}
