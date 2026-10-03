import productRepository from '../repositories/productRepository.js'
import memoryStore from '../utils/memoryStore.js'
import ApiError from '../utils/ApiError.js'

export const productService = {
  // Categories
  async listCategories() {
    return productRepository.listCategories()
  },

  async createCategory(name) {
    const existing = await productRepository.findCategoryByName(name)
    if (existing) throw new ApiError(409, 'Category already exists', null, 'CATEGORY_EXISTS')
    return productRepository.createCategory(name)
  },

  async updateCategory(id, name) {
    const cat = await productRepository.findCategoryById(id)
    if (!cat) throw new ApiError(404, 'Category not found', null, 'NOT_FOUND')
    return productRepository.updateCategory(id, name)
  },

  // Products
  async list({ isStaff = false, categoryId, isLowStock, search, page = 1, limit = 50 } = {}) {
    const { items, total } = await productRepository.listProducts({
      categoryId,
      isLowStock,
      search,
      isActive: isStaff ? undefined : true,
      page,
      limit,
    })

    const mapped = items.map((p) => {
      const stock = Number(p.stock_qty || 0)
      const threshold = Number(p.low_stock_threshold || 5)

      const base = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.category_id,
        brand: p.brand,
        price: Number(p.price),
        taxRatePct: Number(p.tax_rate_pct),
        imageUrl: p.image_url,
        isActive: p.is_active,
        inStock: stock > 0,
      }

      // BR-21: Staff gets exact stock counts and low-stock flag; public NEVER gets raw stockQty
      if (isStaff) {
        base.stockQty = stock
        base.lowStockThreshold = threshold
        base.isLowStock = stock <= threshold
      }

      return base
    })

    return { items: mapped, total }
  },

  async get(id, isStaff = false) {
    const p = await productRepository.findProductById(id)
    if (!p) throw new ApiError(404, 'Product not found', null, 'NOT_FOUND')

    const stock = Number(p.stock_qty || 0)
    const threshold = Number(p.low_stock_threshold || 5)

    const base = {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      categoryId: p.category_id,
      brand: p.brand,
      price: Number(p.price),
      taxRatePct: Number(p.tax_rate_pct),
      imageUrl: p.image_url,
      isActive: p.is_active,
      inStock: stock > 0,
    }

    if (isStaff) {
      base.stockQty = stock
      base.lowStockThreshold = threshold
      base.isLowStock = stock <= threshold
    }

    return base
  },

  async create(data) {
    const existing = await productRepository.findProductBySku(data.sku)
    if (existing) throw new ApiError(409, 'Product SKU already exists', null, 'SKU_EXISTS')

    const created = await productRepository.createProduct(data)
    return this.get(created.id, true)
  },

  async update(id, data) {
    await this.get(id, true)
    const updates = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description
    if (data.categoryId !== undefined) updates.category_id = data.categoryId
    if (data.brand !== undefined) updates.brand = data.brand
    if (data.price !== undefined) updates.price = data.price
    if (data.taxRatePct !== undefined) updates.tax_rate_pct = data.taxRatePct
    if (data.lowStockThreshold !== undefined) updates.low_stock_threshold = data.lowStockThreshold
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl
    if (data.isActive !== undefined) updates.is_active = data.isActive

    await productRepository.updateProduct(id, updates)
    return this.get(id, true)
  },

  async delete(id) {
    await this.get(id, true)
    // Soft delete
    await productRepository.updateProduct(id, { is_active: false })
    return { success: true }
  },

  async adjustStock(id, { delta, reason, note, actorId }) {
    const product = await productRepository.findProductById(id)
    if (!product) throw new ApiError(404, 'Product not found', null, 'NOT_FOUND')

    const currentStock = Number(product.stock_qty || 0)
    const newStock = currentStock + Number(delta)

    if (newStock < 0) {
      throw new ApiError(422, `Cannot reduce stock below 0 (available: ${currentStock})`, null, 'OUT_OF_STOCK')
    }

    const threshold = Number(product.low_stock_threshold || 5)
    let lowStockAlerted = product.low_stock_alerted

    // If stock crosses threshold downwards and not previously alerted
    if (newStock <= threshold && !lowStockAlerted) {
      lowStockAlerted = true
      // Insert low-stock notification
      memoryStore.insert('notifications', {
        type: 'low_stock',
        title: `Low Stock Alert: ${product.name}`,
        body: `Only ${newStock} units remaining (threshold: ${threshold})`,
        link: `/staff/shop/products/${product.id}`,
      })
    } else if (newStock > threshold) {
      // Reset alert flag on restock
      lowStockAlerted = false
    }

    await productRepository.updateProduct(id, {
      stock_qty: newStock,
      low_stock_alerted: lowStockAlerted,
    })

    await productRepository.addStockMovement({
      productId: id,
      delta,
      reason,
      note,
      createdBy: actorId,
    })

    return this.get(id, true)
  },

  async getMovements(id) {
    await this.get(id, true)
    return productRepository.getMovements(id)
  },
}

export default productService
