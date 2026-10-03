import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { toClubDate } from '../utils/clubTime.js'

export const membershipRepository = {
  async findActiveByMemberId(memberId, date = new Date()) {
    const dStr = typeof date === 'string' ? date.slice(0, 10) : toClubDate(date)
    try {
      const row = await queryOne(
        `select m.*, p.code as plan_code, p.name as plan_name, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.max_bookings_per_day, p.perks, p.description as plan_description
           from public.memberships m
           join public.plans p on p.id = m.plan_id
          where m.member_id = $1
            and m.status = 'active'
            and m.start_date <= $2
            and m.end_date >= $2
          limit 1`,
        [memberId, dStr]
      )
      if (row) return row
    } catch {}

    const list = memoryStore.find('memberships', (m) =>
      m.member_id === memberId &&
      m.status === 'active' &&
      m.start_date <= dStr &&
      m.end_date >= dStr
    )
    if (list.length > 0) {
      const mem = list[0]
      const plan = memoryStore.findOne('plans', (p) => p.id === mem.plan_id)
      return {
        ...mem,
        plan,
        plan_code: plan?.code,
        plan_name: plan?.name,
        court_discount_pct: plan?.court_discount_pct || 0,
        shop_discount_pct: plan?.shop_discount_pct || 0,
        bar_discount_pct: plan?.bar_discount_pct || 0,
        max_bookings_per_day: plan?.max_bookings_per_day || 2,
        perks: plan?.perks || [],
        plan_description: plan?.description || '',
      }
    }
    return null
  },

  async findByMemberId(memberId) {
    try {
      const rows = await query(
        `select m.*, p.code as plan_code, p.name as plan_name, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.perks, p.description as plan_description
           from public.memberships m
           join public.plans p on p.id = m.plan_id
          where m.member_id = $1
          order by m.start_date desc`,
        [memberId]
      )
      if (rows && rows.length > 0) return rows
    } catch {}

    return memoryStore.find('memberships', (m) => m.member_id === memberId)
  },

  async findById(id) {
    try {
      const row = await queryOne('select * from public.memberships where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('memberships', (m) => m.id === id)
  },

  async create(data) {
    try {
      const row = await queryOne(
        `insert into public.memberships
           (member_id, plan_id, start_date, end_date, status, price_paid, tax_amount, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning *`,
        [
          data.memberId || data.member_id,
          data.planId || data.plan_id,
          data.startDate || data.start_date,
          data.endDate || data.end_date,
          data.status || 'active',
          data.pricePaid ?? data.price_paid ?? 0,
          data.taxAmount ?? data.tax_amount ?? 0,
          data.createdBy || data.created_by || null,
        ]
      )
      if (row) {
        memoryStore.insert('memberships', row)
        return row
      }
    } catch {}

    return memoryStore.insert('memberships', {
      id: data.id || crypto.randomUUID(),
      member_id: data.memberId || data.member_id,
      plan_id: data.planId || data.plan_id,
      start_date: data.startDate || data.start_date,
      end_date: data.endDate || data.end_date,
      status: data.status || 'active',
      price_paid: Number(data.pricePaid ?? data.price_paid ?? 0),
      tax_amount: Number(data.taxAmount ?? data.tax_amount ?? 0),
      created_by: data.createdBy || data.created_by || null,
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
        vals.push(v)
      }
      vals.push(id)
      const row = await queryOne(`update public.memberships set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('memberships', (m) => m.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('memberships', (m) => m.id === id, updates)
  },
}

export default membershipRepository
