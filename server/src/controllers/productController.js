import productService from '../services/productService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created, paginated } from '../utils/response.js'
import { ANY_STAFF } from '../config/roles.js'

// Categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await productService.listCategories()
  return ok(res, categories)
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await productService.createCategory(req.body.name)
  return created(res, category)
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await productService.updateCategory(req.params.id, req.body.name)
  return ok(res, category)
})

// Products
export const listProducts = asyncHandler(async (req, res) => {
  const isStaff = req.user ? ANY_STAFF.includes(req.user.role) : false
  const { page = 1, limit = 50, categoryId, isLowStock, search } = req.query

  const { items, total } = await productService.list({
    isStaff,
    categoryId,
    isLowStock: isLowStock === 'true',
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

export const listLowStock = asyncHandler(async (req, res) => {
  const { items } = await productService.list({
    isStaff: true,
    isLowStock: true,
    page: 1,
    limit: 100,
  })
  return ok(res, items)
})

export const getProduct = asyncHandler(async (req, res) => {
  const isStaff = req.user ? ANY_STAFF.includes(req.user.role) : false
  const product = await productService.get(req.params.id, isStaff)
  return ok(res, product)
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body)
  return created(res, product)
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body)
  return ok(res, product)
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.delete(req.params.id)
  return ok(res, result)
})

export const adjustStock = asyncHandler(async (req, res) => {
  const product = await productService.adjustStock(req.params.id, {
    delta: req.body.delta,
    reason: req.body.reason,
    note: req.body.note,
    actorId: req.user.id,
  })
  return ok(res, product)
})

export const getMovements = asyncHandler(async (req, res) => {
  const movements = await productService.getMovements(req.params.id)
  return ok(res, movements)
})

export default {
  listCategories,
  createCategory,
  updateCategory,
  listProducts,
  listLowStock,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getMovements,
}
