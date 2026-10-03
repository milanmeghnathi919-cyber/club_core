import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const planRepository = {
  async list({ isActive } = {}) {
    try {
      let sql = 'select * from public.plans'
      const params = []
      if (isActive !== undefined) {
        sql += ' where is_active = $1'
        params.push(isActive)
      }
      sql += ' order by price asc'
      const rows = await query(sql, params)
      if (rows && rows.length > 0) return rows
    } catch {}

    let items = memoryStore.find('plans')
    if (isActive !== undefined) {
      items = items.filter((p) => p.is_active === isActive)
    }
    return items
  },

  async findById(id) {
    try {
      const row = await queryOne('select * from public.plans where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('plans', (p) => p.id === id)
  },

  async findByCode(code) {
    const clean = String(code).toUpperCase()
    try {
      const row = await queryOne('select * from public.plans where upper(code) = $1', [clean])
      if (row) return row
    } catch {}
    return memoryStore.findOne('plans', (p) => p.code?.toUpperCase() === clean)
  },

  async create(data) {
    try {
      const row = await queryOne(
        `insert into public.plans
           (code, name, description, price, duration_days, court_discount_pct, shop_discount_pct, bar_discount_pct, max_bookings_per_day, perks, is_active)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         returning *`,
        [
          data.code,
          data.name,
          data.description || null,
          data.price,
          data.durationDays || 365,
          data.courtDiscountPct || 0,
          data.shopDiscountPct || 0,
          data.barDiscountPct || 0,
          data.maxBookingsPerDay || 2,
          JSON.stringify(data.perks || []),
          data.isActive ?? true,
        ]
      )
      if (row) {
        memoryStore.insert('plans', row)
        return row
      }
    } catch {}

    return memoryStore.insert('plans', {
      id: data.id || crypto.randomUUID(),
      code: data.code,
      name: data.name,
      description: data.description || null,
      price: Number(data.price),
      duration_days: Number(data.durationDays || 365),
      court_discount_pct: Number(data.courtDiscountPct || 0),
      shop_discount_pct: Number(data.shopDiscountPct || 0),
      bar_discount_pct: Number(data.barDiscountPct || 0),
      max_bookings_per_day: Number(data.maxBookingsPerDay || 2),
      perks: data.perks || [],
      is_active: data.isActive ?? true,
      created_at: new Date().toISOString(),
    })
  },

  async update(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = $${idx++}`)
        vals.push(k === 'perks' ? JSON.stringify(v) : v)
      }
      vals.push(id)
      const row = await queryOne(`update public.plans set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('plans', (p) => p.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('plans', (p) => p.id === id, updates)
  },
}

export default planRepository
