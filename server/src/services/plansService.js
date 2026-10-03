import planRepository from '../repositories/planRepository.js'
import ApiError from '../utils/ApiError.js'

export const plansService = {
  async list(isStaff = false) {
    const plans = await planRepository.list(isStaff ? undefined : true)
    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      durationDays: p.duration_days,
      courtDiscountPct: Number(p.court_discount_pct),
      shopDiscountPct: Number(p.shop_discount_pct),
      barDiscountPct: Number(p.bar_discount_pct),
      maxBookingsPerDay: p.max_bookings_per_day,
      perks: typeof p.perks === 'string' ? JSON.parse(p.perks) : (p.perks || []),
      isActive: p.is_active,
    }))
  },

  async get(id) {
    const p = await planRepository.findById(id)
    if (!p) throw new ApiError(404, 'Plan not found', null, 'NOT_FOUND')
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      durationDays: p.duration_days,
      courtDiscountPct: Number(p.court_discount_pct),
      shopDiscountPct: Number(p.shop_discount_pct),
      barDiscountPct: Number(p.bar_discount_pct),
      maxBookingsPerDay: p.max_bookings_per_day,
      perks: typeof p.perks === 'string' ? JSON.parse(p.perks) : (p.perks || []),
      isActive: p.is_active,
    }
  },

  async create(data) {
    const existing = await planRepository.findByCode(data.code)
    if (existing) {
      throw new ApiError(409, 'Plan code already exists', null, 'PLAN_CODE_EXISTS')
    }
    const created = await planRepository.create(data)
    return this.get(created.id)
  },

  async update(id, data) {
    await this.get(id)
    const updates = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.description !== undefined) updates.description = data.description
    if (data.price !== undefined) updates.price = data.price
    if (data.durationDays !== undefined) updates.duration_days = data.durationDays
    if (data.courtDiscountPct !== undefined) updates.court_discount_pct = data.courtDiscountPct
    if (data.shopDiscountPct !== undefined) updates.shop_discount_pct = data.shopDiscountPct
    if (data.barDiscountPct !== undefined) updates.bar_discount_pct = data.barDiscountPct
    if (data.maxBookingsPerDay !== undefined) updates.max_bookings_per_day = data.maxBookingsPerDay
    if (data.perks !== undefined) updates.perks = data.perks
    if (data.isActive !== undefined) updates.is_active = data.isActive

    await planRepository.update(id, updates)
    return this.get(id)
  },
}

export default plansService
