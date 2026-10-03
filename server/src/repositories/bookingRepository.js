import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextBookingNo } from '../utils/numbering.js'

export const bookingRepository = {
  async insert(data) {
    const bookingNo = data.bookingNo || data.booking_no || nextBookingNo()
    try {
      const row = await queryOne(
        `insert into public.bookings
           (booking_no, court_id, booking_type, member_id, guest_name, guest_phone,
            start_at, end_at, status, base_price, discount_pct, price, tax_amount,
            payment_status, source, capacity, price_per_head, title, notes, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         returning *`,
        [
          bookingNo,
          data.courtId || data.court_id,
          data.bookingType || data.booking_type || 'regular',
          data.memberId || data.member_id || null,
          data.guestName || data.guest_name || null,
          data.guestPhone || data.guest_phone || null,
          data.startAt || data.start_at,
          data.endAt || data.end_at,
          data.status || 'confirmed',
          data.basePrice ?? data.base_price ?? 0,
          data.discountPct ?? data.discount_pct ?? 0,
          data.price ?? 0,
          data.taxAmount ?? data.tax_amount ?? 0,
          data.paymentStatus || data.payment_status || 'unpaid',
          data.source || 'staff_counter',
          data.capacity || null,
          data.pricePerHead || data.price_per_head || null,
          data.title || null,
          data.notes || null,
          data.createdBy || data.created_by || null,
        ]
      )
      if (row) {
        memoryStore.insert('bookings', row)
        return row
      }
    } catch (err) {
      if (err.code === '23P01') throw err
    }

    return memoryStore.insert('bookings', {
      id: data.id || crypto.randomUUID(),
      booking_no: bookingNo,
      court_id: data.courtId || data.court_id,
      booking_type: data.bookingType || data.booking_type || 'regular',
      member_id: data.memberId || data.member_id || null,
      guest_name: data.guestName || data.guest_name || null,
      guest_phone: data.guestPhone || data.guest_phone || null,
      start_at: data.startAt || data.start_at,
      end_at: data.endAt || data.end_at,
      status: data.status || 'confirmed',
      base_price: Number(data.basePrice ?? data.base_price ?? 0),
      discount_pct: Number(data.discountPct ?? data.discount_pct ?? 0),
      price: Number(data.price ?? 0),
      tax_amount: Number(data.taxAmount ?? data.tax_amount ?? 0),
      payment_status: data.paymentStatus || data.payment_status || 'unpaid',
      source: data.source || 'staff_counter',
      capacity: data.capacity || null,
      price_per_head: data.pricePerHead || data.price_per_head || null,
      title: data.title || null,
      notes: data.notes || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async findById(id) {
    try {
      const row = await queryOne('select * from public.bookings where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('bookings', (b) => b.id === id)
  },

  async findOverlapping(courtId, startAt, endAt, excludeId = null) {
    try {
      let sql = `select * from public.bookings
                  where court_id = $1
                    and status <> 'cancelled'
                    and start_at < $3
                    and end_at > $2`
      const params = [courtId, startAt, endAt]
      if (excludeId) {
        sql += ' and id <> $4'
        params.push(excludeId)
      }
      const rows = await query(sql, params)
      if (rows && rows.length > 0) return rows
    } catch {}

    return memoryStore.find('bookings', (b) =>
      b.court_id === courtId &&
      b.status !== 'cancelled' &&
      b.start_at < endAt &&
      b.end_at > startAt &&
      (!excludeId || b.id !== excludeId)
    )
  },

  async findMemberOverlapping(memberId, startAt, endAt, excludeId = null) {
    if (!memberId) return []
    try {
      let sql = `select * from public.bookings
                  where member_id = $1
                    and status <> 'cancelled'
                    and start_at < $3
                    and end_at > $2`
      const params = [memberId, startAt, endAt]
      if (excludeId) {
        sql += ' and id <> $4'
        params.push(excludeId)
      }
      const rows = await query(sql, params)
      if (rows && rows.length > 0) return rows
    } catch {}

    return memoryStore.find('bookings', (b) =>
      b.member_id === memberId &&
      b.status !== 'cancelled' &&
      b.start_at < endAt &&
      b.end_at > startAt &&
      (!excludeId || b.id !== excludeId)
    )
  },

  async countMemberSessionsOnDate(memberId, startIso, endIso) {
    if (!memberId) return 0
    try {
      const row = await queryOne(
        `select count(*)::int as count from public.bookings
          where member_id = $1
            and status in ('confirmed', 'completed', 'no_show')
            and start_at >= $2
            and start_at <= $3`,
        [memberId, startIso, endIso]
      )
      if (row) return Number(row.count)
    } catch {}

    const bookings = memoryStore.find(
      'bookings',
      (b) =>
        b.member_id === memberId &&
        ['confirmed', 'completed', 'no_show'].includes(b.status) &&
        b.start_at >= startIso &&
        b.start_at <= endIso
    )
    return bookings.length
  },

  async list({ date, courtId, memberId, status, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    let items = memoryStore.find('bookings')

    if (date) {
      items = items.filter((b) => b.start_at && b.start_at.startsWith(date))
    }
    if (courtId) {
      items = items.filter((b) => b.court_id === courtId)
    }
    if (memberId) {
      items = items.filter((b) => b.member_id === memberId)
    }
    if (status) {
      items = items.filter((b) => b.status === status)
    }

    items.sort((a, b) => new Date(b.start_at) - new Date(a.start_at))

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    }
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
      const row = await queryOne(`update public.bookings set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('bookings', (b) => b.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('bookings', (b) => b.id === id, updates)
  },
}

export default bookingRepository
