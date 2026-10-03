import memberService from '../services/memberService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const listMembers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const data = await memberService.list({ page, limit, search: req.query.search })
  res.json({ success: true, ...data })
})

export const getMember = asyncHandler(async (req, res) => {
  const member = await memberService.getById(req.params.id)
  res.json({ success: true, data: member })
})

export const createMember = asyncHandler(async (req, res) => {
  const member = await memberService.create(req.body, {
    photo: req.file,
    createdBy: req.user?.sub ?? null,
  })
  res.status(201).json({ success: true, data: member })
})

export const updateMember = asyncHandler(async (req, res) => {
  const member = await memberService.updateById(req.params.id, req.body, { photo: req.file })
  res.json({ success: true, data: member })
})

export const deleteMember = asyncHandler(async (req, res) => {
  await memberService.remove(req.params.id)
  res.status(204).send()
})