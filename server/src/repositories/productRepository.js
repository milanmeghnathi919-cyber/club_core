import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const productRepository = {
  // Categories
  async listCategories() {
    try {
      const rows = await query('select * from public.product_categories order by name asc')
      if (rows && rows.length > 0) return rows
    } catch {}
    return memoryStore.find('product_categories').sort((a, b) => a.name.localeCompare(b.name))
  },

  async findCategoryById(id) {
    try {
      const row = await queryOne('select * from public.product_categories where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('product_categories', (c) => c.id === id)
  },

  async findCategoryByName(name) {
    try {
      const row = await queryOne('select * from public.product_categories where lower(name) = lower($1)', [name])
      if (row) return row
    } catch {}
    return memoryStore.findOne('product_categories', (c) => c.name?.toLowerCase() === name.toLowerCase())
  },

  async createCategory(name) {
    try {
      const row = await queryOne('insert into public.product_categories (name) values ($1) returning *', [name])
      if (row) {
        memoryStore.insert('product_categories', row)
        return row
      }
    } catch {}
    return memoryStore.insert('product_categories', { name })
  },

  async updateCategory(id, name) {
    try {
      const row = await queryOne('update public.product_categories set name = $1 where id = $2 returning *', [name, id])
      if (row) {
        memoryStore.update('product_categories', (c) => c.id === id, { name })
        return row
      }
    } catch {}
    return memoryStore.update('product_categories', (c) => c.id === id, { name })
  },

  // Products
  async listProducts({ categoryId, isLowStock, search, isActive = true, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    let items = memoryStore.find('products')

    if (isActive !== undefined) {
      items = items.filter((p) => p.is_active === isActive)
    }
    if (categoryId) {
      items = items.filter((p) => p.category_id === categoryId)
    }
    if (isLowStock) {
      items = items.filter((p) => Number(p.stock_qty) <= Number(p.low_stock_threshold))
    }
    if (search) {
      const s = search.toLowerCase()
      items = items.filter((p) => p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s))
    }

    items.sort((a, b) => a.name.localeCompare(b.name))
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    }
  },

  async findProductById(id) {
    try {
      const row = await queryOne('select * from public.products where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('products', (p) => p.id === id)
  },

  async findProductBySku(sku) {
    try {
      const row = await queryOne('select * from public.products where upper(sku) = upper($1)', [sku])
      if (row) return row
    } catch {}
    return memoryStore.findOne('products', (p) => p.sku?.toUpperCase() === sku.toUpperCase())
  },

  async createProduct(data) {
    try {
      const row = await queryOne(
        `insert into public.products
           (sku, name, description, category_id, brand, price, tax_rate_pct, stock_qty, low_stock_threshold, low_stock_alerted, image_url, is_active)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         returning *`,
        [
          data.sku,
          data.name,
          data.description || null,
          data.categoryId || data.category_id,
          data.brand || null,
          data.price,
          data.taxRatePct ?? data.tax_rate_pct ?? 18,
          data.stockQty ?? data.stock_qty ?? 0,
          data.lowStockThreshold ?? data.low_stock_threshold ?? 5,
          false,
          data.imageUrl || data.image_url || null,
          data.isActive ?? data.is_active ?? true,
        ]
      )
      if (row) {
        memoryStore.insert('products', row)
        return row
      }
    } catch {}

    return memoryStore.insert('products', {
      id: data.id || crypto.randomUUID(),
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      category_id: data.categoryId || data.category_id,
      brand: data.brand || null,
      price: Number(data.price),
      tax_rate_pct: Number(data.taxRatePct ?? data.tax_rate_pct ?? 18),
      stock_qty: Number(data.stockQty ?? data.stock_qty ?? 0),
      low_stock_threshold: Number(data.lowStockThreshold ?? data.low_stock_threshold ?? 5),
      low_stock_alerted: false,
      image_url: data.imageUrl || data.image_url || null,
      is_active: data.isActive ?? data.is_active ?? true,
      created_at: new Date().toISOString(),
    })
  },

  async updateProduct(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = $${idx++}`)
        vals.push(v)
      }
      vals.push(id)
      const row = await queryOne(`update public.products set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('products', (p) => p.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('products', (p) => p.id === id, updates)
  },

  async addStockMovement(data) {
    return memoryStore.insert('stock_movements', {
      id: data.id || crypto.randomUUID(),
      product_id: data.productId || data.product_id,
      delta: Number(data.delta),
      reason: data.reason,
      ref_type: data.refType || data.ref_type || null,
      ref_id: data.refId || data.ref_id || null,
      note: data.note || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async getMovements(productId) {
    const list = memoryStore.find('stock_movements', (m) => m.product_id === productId)
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  },
}

export default productRepository
