import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextPaymentNo } from '../utils/numbering.js'
import { toClubDate } from '../utils/clubTime.js'

export const paymentRepository = {
  async insert(data) {
    const paymentNo = data.paymentNo || nextPaymentNo()
    const paidAt = data.status === 'paid' ? (data.paidAt || new Date().toISOString()) : null

    try {
      const row = await queryOne(
        `insert into public.payments
           (payment_no, source_type, source_id, member_id, amount, method, status, revenue_category, tax_amount, razorpay_order_id, razorpay_payment_id, received_by, paid_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         returning *`,
        [
          paymentNo,
          data.sourceType,
          data.sourceId,
          data.memberId || null,
          data.amount,
          data.method,
          data.status || 'paid',
          data.revenueCategory || data.category || 'court',
          data.taxAmount || 0,
          data.razorpayOrderId || null,
          data.razorpayPaymentId || null,
          data.receivedBy || null,
          paidAt,
        ]
      )
      if (row) {
        memoryStore.insert('payments', row)
        return row
      }
    } catch {
      // fallback
    }

    return memoryStore.insert('payments', {
      id: data.id || crypto.randomUUID(),
      payment_no: paymentNo,
      source_type: data.sourceType,
      source_id: data.sourceId,
      member_id: data.memberId || null,
      amount: Number(data.amount),
      method: data.method,
      status: data.status || 'paid',
      revenue_category: data.revenueCategory || data.category || 'court',
      tax_amount: Number(data.taxAmount || 0),
      razorpay_order_id: data.razorpayOrderId || null,
      razorpay_payment_id: data.razorpayPaymentId || null,
      received_by: data.receivedBy || null,
      paid_at: paidAt,
      created_at: new Date().toISOString(),
    })
  },

  async findById(id) {
    try {
      const row = await queryOne('select * from public.payments where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('payments', (p) => p.id === id)
  },

  async findByRazorpayPaymentId(razorpayPaymentId) {
    if (!razorpayPaymentId) return null
    try {
      const row = await queryOne('select * from public.payments where razorpay_payment_id = $1', [razorpayPaymentId])
      if (row) return row
    } catch {}
    return memoryStore.findOne('payments', (p) => p.razorpay_payment_id === razorpayPaymentId)
  },

  async updateStatus(id, status) {
    try {
      const row = await queryOne(
        'update public.payments set status = $1, updated_at = now() where id = $2 returning *',
        [status, id]
      )
      if (row) {
        memoryStore.update('payments', (p) => p.id === id, { status })
        return row
      }
    } catch {}
    return memoryStore.update('payments', (p) => p.id === id, { status })
  },

  async list({ from, to, method, sourceType, revenueCategory, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit
    try {
      let sql = 'select *, count(*) over ()::int as total_count from public.payments where 1=1'
      const params = []
      let idx = 1

      if (from) {
        sql += ` and paid_at >= $${idx++}`
        params.push(from)
      }
      if (to) {
        sql += ` and paid_at <= $${idx++}`
        params.push(to)
      }
      if (method) {
        sql += ` and method = $${idx++}`
        params.push(method)
      }
      if (sourceType) {
        sql += ` and source_type = $${idx++}`
        params.push(sourceType)
      }
      if (revenueCategory) {
        sql += ` and revenue_category = $${idx++}`
        params.push(revenueCategory)
      }

      sql += ` order by paid_at desc nulls last limit $${idx++} offset $${idx++}`
      params.push(limit, offset)

      const rows = await query(sql, params)
      const total = rows.length ? Number(rows[0].total_count) : 0
      return { items: rows, total }
    } catch {
      let items = memoryStore.find('payments')
      if (from) items = items.filter((p) => p.paid_at && p.paid_at >= from)
      if (to) items = items.filter((p) => p.paid_at && p.paid_at <= to)
      if (method) items = items.filter((p) => p.method === method)
      if (sourceType) items = items.filter((p) => p.source_type === sourceType)
      if (revenueCategory) items = items.filter((p) => p.revenue_category === revenueCategory)

      items.sort((a, b) => new Date(b.paid_at || 0) - new Date(a.paid_at || 0))
      return {
        items: items.slice(offset, offset + limit),
        total: items.length,
      }
    }
  },

  async getPaidRows(from, to) {
    try {
      let sql = "select * from public.payments where status = 'paid'"
      const params = []
      let idx = 1
      if (from) {
        sql += ` and paid_at >= $${idx++}`
        params.push(from)
      }
      if (to) {
        sql += ` and paid_at <= $${idx++}`
        params.push(to)
      }
      const rows = await query(sql, params)
      if (rows && rows.length > 0) return rows
    } catch {}

    let items = memoryStore.find('payments', (p) => p.status === 'paid')
    if (from) items = items.filter((p) => p.paid_at && p.paid_at >= from)
    if (to) items = items.filter((p) => p.paid_at && p.paid_at <= to)
    return items
  },
}

export default paymentRepository
