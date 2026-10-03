import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextBookingNo } from '../utils/numbering.js'

export const enrichBookingRow = (b, court = null, member = null) => {
  if (!b) return null
  const courtName = court?.name || b.court_name || 'Championship Court'
  const courtSport = court?.sport || b.court_sport || 'Tennis'
  const courtRate = Number(court?.rate_per_hour || court?.ratePerHour || b.court_rate_per_hour || 0)

  let memObj = member
  let planObj = null
  const memberIdVal = b.member_id || b.memberId

  if (!memObj && memberIdVal) {
    memObj = memoryStore.findOne('members', (m) => m.id === memberIdVal)
    if (memObj) {
      const activeMembership = memoryStore.findOne('memberships', (ms) => ms.member_id === memberIdVal && ms.status === 'active')
      if (activeMembership) {
        planObj = memoryStore.findOne('plans', (p) => p.id === activeMembership.plan_id)
      }
    }
  }

  const memberName = b.member_name || memObj?.full_name || memObj?.fullName || null
  const memberPhone = b.member_phone || memObj?.phone || null
  const memberEmail = b.member_email || b.user_email || memObj?.email || null
  const memberCode = b.member_code || memObj?.member_code || memObj?.memberCode || null
  const planName = b.plan_name || planObj?.name || null
  const planCode = b.plan_code || planObj?.code || null

  const guestName = b.guest_name || b.guestName || null
  const guestPhone = b.guest_phone || b.guestPhone || null

  const resolvedMemberName = memberName || guestName || (memberIdVal ? 'Club Member' : 'Guest')

  return {
    ...b,
    id: b.id,
    bookingNo: b.booking_no || b.bookingNo,
    booking_no: b.booking_no || b.bookingNo,
    courtId: b.court_id || b.courtId,
    court_id: b.court_id || b.courtId,
    bookingType: b.booking_type || b.bookingType || 'regular',
    booking_type: b.booking_type || b.bookingType || 'regular',
    memberId: memberIdVal || null,
    member_id: memberIdVal || null,
    guestName,
    guest_name: guestName,
    guestPhone,
    guest_phone: guestPhone,
    startAt: b.start_at || b.startAt,
    start_at: b.start_at || b.startAt,
    endAt: b.end_at || b.endAt,
    end_at: b.end_at || b.endAt,
    status: b.status || 'confirmed',
    basePrice: Number(b.base_price ?? b.basePrice ?? 0),
    base_price: Number(b.base_price ?? b.basePrice ?? 0),
    discountPct: Number(b.discount_pct ?? b.discountPct ?? 0),
    discount_pct: Number(b.discount_pct ?? b.discountPct ?? 0),
    price: Number(b.price ?? 0),
    taxAmount: Number(b.tax_amount ?? b.taxAmount ?? 0),
    tax_amount: Number(b.tax_amount ?? b.taxAmount ?? 0),
    paymentStatus: b.payment_status || b.paymentStatus || 'unpaid',
    payment_status: b.payment_status || b.paymentStatus || 'unpaid',
    source: b.source || 'staff_counter',
    capacity: b.capacity || null,
    pricePerHead: b.price_per_head ?? b.pricePerHead ?? null,
    price_per_head: b.price_per_head ?? b.pricePerHead ?? null,
    title: b.title || null,
    notes: b.notes || null,
    createdBy: b.created_by || b.createdBy || null,
    created_by: b.created_by || b.createdBy || null,
    createdAt: b.created_at || b.createdAt,
    created_at: b.created_at || b.createdAt,
    court: {
      id: b.court_id || b.courtId,
      name: courtName,
      sport: courtSport,
      ratePerHour: courtRate,
      rate_per_hour: courtRate,
    },
    court_name: courtName,
    court_sport: courtSport,
    member: memberIdVal
      ? {
          id: memberIdVal,
          fullName: memberName || 'Club Member',
          name: memberName || 'Club Member',
          phone: memberPhone,
          email: memberEmail,
          memberCode,
          planName,
          planCode,
        }
      : null,
    guest: guestName
      ? {
          name: guestName,
          phone: guestPhone,
        }
      : null,
    memberName: resolvedMemberName,
    memberPhone: memberPhone || guestPhone || null,
    memberEmail: memberEmail || null,
    memberCode: memberCode || null,
    planName: planName || null,
    planCode: planCode || null,
  }
}

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
        let court = null
        try {
          court = await queryOne('select * from public.courts where id = $1', [row.court_id])
        } catch {}
        return enrichBookingRow(row, court)
      }
    } catch (err) {
      if (err.code === '23P01') throw err
    }

    const court = memoryStore.findOne('courts', (c) => c.id === (data.courtId || data.court_id))
    const inserted = memoryStore.insert('bookings', {
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
    return enrichBookingRow(inserted, court)
  },

  async findById(id) {
    try {
      const row = await queryOne(
        `SELECT b.*,
                c.name AS court_name,
                c.sport AS court_sport,
                c.rate_per_hour AS court_rate_per_hour,
                m.full_name AS member_name,
                m.phone AS member_phone,
                COALESCE(m.email, u.email) AS member_email,
                m.member_code AS member_code,
                p.name AS plan_name,
                p.code AS plan_code
         FROM public.bookings b
         LEFT JOIN public.courts c ON b.court_id = c.id
         LEFT JOIN public.members m ON b.member_id = m.id
         LEFT JOIN public.users u ON m.user_id = u.id
         LEFT JOIN public.memberships ms ON m.id = ms.member_id AND ms.status = 'active'
         LEFT JOIN public.plans p ON ms.plan_id = p.id
         WHERE b.id = $1`,
        [id]
      )
      if (row) return enrichBookingRow(row)
    } catch {}
    const memRow = memoryStore.findOne('bookings', (b) => b.id === id)
    if (!memRow) return null
    const court = memoryStore.findOne('courts', (c) => c.id === (memRow.court_id || memRow.courtId))
    return enrichBookingRow(memRow, court)
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

  async list({ date, courtId, memberId, userId, userEmail, status, upcoming, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    try {
      let conditions = ['1=1']
      const params = []
      let idx = 1

      if (date) {
        conditions.push(`b.start_at::text LIKE $${idx++} || '%'`)
        params.push(date)
      }
      if (courtId) {
        conditions.push(`b.court_id = $${idx++}`)
        params.push(courtId)
      }
      if (memberId) {
        conditions.push(`b.member_id = $${idx++}`)
        params.push(memberId)
      }
      if (userId) {
        if (userEmail) {
          conditions.push(`(
            b.created_by = $${idx}
            OR b.member_id IN (
              SELECT id FROM public.members WHERE user_id = $${idx} OR lower(email) = lower($${idx + 1})
            )
          )`)
          params.push(userId, userEmail)
          idx += 2
        } else {
          conditions.push(`(
            b.created_by = $${idx}
            OR b.member_id IN (
              SELECT id FROM public.members WHERE user_id = $${idx}
            )
          )`)
          params.push(userId)
          idx += 1
        }
      }
      if (status) {
        conditions.push(`b.status = $${idx++}`)
        params.push(status)
      }
      if (upcoming) {
        conditions.push(`b.start_at >= now()`)
      }

      const whereClause = conditions.join(' AND ')
      const countSql = `SELECT count(*)::int as total FROM public.bookings b WHERE ${whereClause}`
      const totalRow = await queryOne(countSql, params)
      const total = totalRow ? Number(totalRow.total) : 0

      const orderDir = upcoming ? 'ASC' : 'DESC'
      const dataSql = `
        SELECT b.*,
               c.name AS court_name,
               c.sport AS court_sport,
               c.rate_per_hour AS court_rate_per_hour,
               m.full_name AS member_name,
               m.phone AS member_phone,
               COALESCE(m.email, u.email) AS member_email,
               m.member_code AS member_code,
               p.name AS plan_name,
               p.code AS plan_code
        FROM public.bookings b
        LEFT JOIN public.courts c ON b.court_id = c.id
        LEFT JOIN public.members m ON b.member_id = m.id
        LEFT JOIN public.users u ON m.user_id = u.id
        LEFT JOIN public.memberships ms ON m.id = ms.member_id AND ms.status = 'active'
        LEFT JOIN public.plans p ON ms.plan_id = p.id
        WHERE ${whereClause}
        ORDER BY b.start_at ${orderDir}
        LIMIT $${idx++} OFFSET $${idx++}
      `
      const rows = await query(dataSql, [...params, limit, offset])
      if (rows) {
        return {
          items: rows.map((r) => enrichBookingRow(r)),
          total,
        }
      }
    } catch (err) {
      // In case of any DB error or disconnect, fall back to memoryStore
    }

    let items = memoryStore.find('bookings')

    if (date) {
      items = items.filter((b) => (b.start_at || b.startAt) && (b.start_at || b.startAt).startsWith(date))
    }
    if (courtId) {
      items = items.filter((b) => (b.court_id || b.courtId) === courtId)
    }
    if (memberId) {
      items = items.filter((b) => (b.member_id || b.memberId) === memberId)
    }
    if (userId) {
      items = items.filter((b) => {
        if (b.created_by === userId || b.createdBy === userId) return true
        const mem = memoryStore.findOne('members', (m) => m.id === (b.member_id || b.memberId))
        if (mem && (mem.user_id === userId || mem.userId === userId || (userEmail && String(mem.email).toLowerCase() === String(userEmail).toLowerCase()))) return true
        return false
      })
    }
    if (status) {
      items = items.filter((b) => b.status === status)
    }
    if (upcoming) {
      const nowIso = new Date().toISOString()
      items = items.filter((b) => (b.start_at || b.startAt) >= nowIso)
    }

    items.sort((a, b) => {
      const diff = new Date(a.start_at || a.startAt) - new Date(b.start_at || b.startAt)
      return upcoming ? diff : -diff
    })

    const courts = memoryStore.find('courts') || []
    const courtMap = new Map(courts.map((c) => [c.id, c]))

    const sliced = items.slice(offset, offset + limit).map((b) => {
      const c = courtMap.get(b.court_id || b.courtId)
      return enrichBookingRow(b, c)
    })

    return {
      items: sliced,
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
        return this.findById(id)
      }
    } catch {}

    memoryStore.update('bookings', (b) => b.id === id, updates)
    return this.findById(id)
  },
}

export default bookingRepository
