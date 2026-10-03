import publicService from '../services/publicService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created, paginated } from '../utils/response.js'

export const getClub = asyncHandler(async (req, res) => {
  const info = await publicService.getClubInfo()
  return ok(res, info)
})

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await publicService.getPlans()
  return ok(res, plans)
})

export const getCourts = asyncHandler(async (req, res) => {
  const courts = await publicService.getCourts()
  return ok(res, courts)
})

export const getAvailability = asyncHandler(async (req, res) => {
  const result = await publicService.getAvailability({
    from: req.query.from,
    days: req.query.days ? Number(req.query.days) : 7,
    sport: req.query.sport,
  })
  return ok(res, result)
})

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await publicService.getCategories()
  return ok(res, categories)
})

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, categoryId, search } = req.query
  const { items, total } = await publicService.getProducts({
    categoryId,
    search,
    page: Number(page),
    limit: Number(limit),
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await publicService.getProduct(req.params.id)
  return ok(res, product)
})

export const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await publicService.createEnquiry(req.body)
  return created(res, enquiry)
})

export const createTrialBooking = asyncHandler(async (req, res) => {
  const result = await publicService.createTrialBooking(req.body)
  return created(res, result)
})

export default {
  getClub,
  getPlans,
  getCourts,
  getAvailability,
  getCategories,
  getProducts,
  getProduct,
  createEnquiry,
  createTrialBooking,
}
