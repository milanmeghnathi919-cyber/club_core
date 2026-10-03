import socialService from '../services/socialService.js'
import memberRepository from '../repositories/memberRepository.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const sessions = await socialService.list(req.query)
  return ok(res, sessions)
})

export const create = asyncHandler(async (req, res) => {
  const session = await socialService.create({
    ...req.body,
    actorId: req.user.id,
  })
  return created(res, session)
})

export const generate = asyncHandler(async (req, res) => {
  const result = await socialService.generate({
    ...req.body,
    actorId: req.user.id,
  })
  return ok(res, result)
})

export const join = asyncHandler(async (req, res) => {
  let memberId = req.body.memberId || null
  if (req.user.role === 'member') {
    const member = await memberRepository.findByUserId(req.user.id)
    if (member) memberId = member.id
  }

  const result = await socialService.join(req.params.id, {
    memberId,
    guestName: req.body.guestName,
    paymentMethod: req.body.paymentMethod || 'cash',
    actorId: req.user.id,
  })
  return created(res, result)
})

export const leave = asyncHandler(async (req, res) => {
  const result = await socialService.leave(req.params.id, req.params.pid, req.user.id)
  return ok(res, result)
})

export const cancel = asyncHandler(async (req, res) => {
  const result = await socialService.cancel(req.params.id, req.user.id)
  return ok(res, result)
})

export default {
  list,
  create,
  generate,
  join,
  leave,
  cancel,
}
