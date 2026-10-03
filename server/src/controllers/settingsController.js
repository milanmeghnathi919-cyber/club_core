import settingsService from '../services/settingsService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok } from '../utils/response.js'

export const get = asyncHandler(async (req, res) => {
  const settings = await settingsService.get()
  return ok(res, settings)
})

export const update = asyncHandler(async (req, res) => {
  const updated = await settingsService.update(req.body)
  return ok(res, updated)
})

export default {
  get,
  update,
}
