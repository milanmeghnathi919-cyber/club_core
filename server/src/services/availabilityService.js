import courtRepository from '../repositories/courtRepository.js'
import settingsService from './settingsService.js'
import membershipService from './membershipService.js'
import memoryStore from '../utils/memoryStore.js'
import { query } from '../utils/db.js'
import { toClubDate, parseClubDateTime, generateTimeSlots, localDayRange } from '../utils/clubTime.js'
import { round2, calcInclusiveTax } from '../utils/money.js'

export const availabilityService = {
  /**
   * Price quote helper: calculates base, discountPct, price, tax for a given court and member at a start time.
   */
  async quoteCourtPrice(court, memberId, startAt) {
    const basePrice = Number(court.rate_per_hour || court.ratePerHour) || 0
    let discountPct = 0

    if (memberId) {
      discountPct = await membershipService.discountFor(memberId, 'court', startAt)
    }

    const price = round2(basePrice * (1 - discountPct / 100))
    const taxAmount = calcInclusiveTax(price, 18)

    return {
      basePrice,
      discountPct,
      price,
      taxAmount,
    }
  },

  /**
   * Main availability engine for staff & member grid.
   */
  async getAvailability({ date = toClubDate(), sport = null, courtId = null, memberId = null, isStaff = false }) {
    const settings = await settingsService.get()
    const openTime = settings.openTime || '06:00'
    const closeTime = settings.closeTime || '22:00'

    // Fetch courts
    let courts = await courtRepository.list({ isActive: true, sport })
    if (courtId) {
      courts = courts.filter((c) => c.id === courtId)
    }

    const { startIso, endIso } = localDayRange(date)
    const nowIso = new Date().toISOString()

    // Fetch bookings & social sessions for this day from PostgreSQL with memoryStore fallback
    let dbBookings = []
    try {
      dbBookings = await query(
        `SELECT b.*,
                m.full_name AS member_name,
                m.phone AS member_phone,
                COALESCE(m.email, u.email) AS member_email,
                m.member_code AS member_code,
                p.name AS plan_name,
                p.code AS plan_code
         FROM public.bookings b
         LEFT JOIN public.members m ON b.member_id = m.id
         LEFT JOIN public.users u ON m.user_id = u.id
         LEFT JOIN public.memberships ms ON m.id = ms.member_id AND ms.status = 'active'
         LEFT JOIN public.plans p ON ms.plan_id = p.id
         WHERE b.status <> 'cancelled'
           AND b.start_at < $2
           AND b.end_at > $1`,
        [startIso, endIso]
      )
    } catch {
      // fallback
    }

    const memBookings = memoryStore.find(
      'bookings',
      (b) => b.status !== 'cancelled' && (b.start_at || b.startAt) < endIso && (b.end_at || b.endAt) > startIso
    )

    const toIso = (val) => {
      if (!val) return null
      if (val instanceof Date) return val.toISOString()
      return new Date(val).toISOString()
    }

    const bookingMap = new Map()
    for (const b of (dbBookings || [])) {
      bookingMap.set(b.id, {
        ...b,
        court_id: b.court_id || b.courtId,
        start_at: toIso(b.start_at || b.startAt),
        end_at: toIso(b.end_at || b.endAt),
        booking_type: b.booking_type || b.bookingType || 'regular',
      })
    }
    for (const b of (memBookings || [])) {
      if (!bookingMap.has(b.id)) {
        let memObj = null
        let planObj = null
        const memberIdVal = b.member_id || b.memberId
        if (memberIdVal) {
          memObj = memoryStore.findOne('members', (m) => m.id === memberIdVal)
          if (memObj) {
            const ms = memoryStore.findOne('memberships', (m) => m.member_id === memberIdVal && m.status === 'active')
            if (ms) planObj = memoryStore.findOne('plans', (p) => p.id === ms.plan_id)
          }
        }
        bookingMap.set(b.id, {
          ...b,
          court_id: b.court_id || b.courtId,
          start_at: toIso(b.start_at || b.startAt),
          end_at: toIso(b.end_at || b.endAt),
          booking_type: b.booking_type || b.bookingType || 'regular',
          member_name: b.member_name || memObj?.full_name || null,
          member_phone: b.member_phone || memObj?.phone || null,
          member_email: b.member_email || memObj?.email || null,
          member_code: b.member_code || memObj?.member_code || null,
          plan_name: b.plan_name || planObj?.name || null,
          plan_code: b.plan_code || planObj?.code || null,
        })
      }
    }

    const allBookings = Array.from(bookingMap.values())
    const socialSessions = allBookings.filter((b) => b.booking_type === 'social_session')

    const timeSlots = generateTimeSlots(openTime, closeTime, 60, 30)

    const courtAvailability = await Promise.all(
      courts.map(async (court) => {
        const courtBookings = allBookings.filter((b) => b.court_id === court.id)
        const quote = await this.quoteCourtPrice(court, memberId, parseClubDateTime(date, timeSlots[0]))

        const slots = timeSlots.map((time) => {
          const slotStart = parseClubDateTime(date, time)
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)
          const slotStartIso = slotStart.toISOString()
          const slotEndIso = slotEnd.toISOString()

          let state = 'available'
          let activeBooking = null
          let activeSocial = null

          // Past check
          if (slotStartIso < nowIso) {
            state = 'past'
          }

          // Social check (does a social session overlap this 60m slot?)
          for (const s of socialSessions) {
            if (s.court_id === court.id && slotStartIso < s.end_at && slotEndIso > s.start_at) {
              state = 'social'
              activeSocial = s
              break
            }
          }

          // Regular booking overlap check: slot overlaps if slotStart < booking.end_at AND slotEnd > booking.start_at
          if (state !== 'social') {
            for (const b of courtBookings) {
              if (b.booking_type !== 'social_session' && slotStartIso < b.end_at && slotEndIso > b.start_at) {
                state = 'booked'
                activeBooking = b
                break
              }
            }
          }

          const slotData = {
            time,
            startAt: slotStartIso,
            endAt: slotEndIso,
            state,
            price: quote.price,
          }

          if (isStaff && activeBooking) {
            const memberIdVal = activeBooking.member_id || activeBooking.memberId
            const guestName = activeBooking.guest_name || activeBooking.guestName
            const guestPhone = activeBooking.guest_phone || activeBooking.guestPhone
            const memberName = activeBooking.member_name || activeBooking.memberName
            const resolvedName = memberName || guestName || (memberIdVal ? 'Club Member' : 'Guest')

            slotData.bookingId = activeBooking.id
            slotData.booking = {
              id: activeBooking.id,
              bookingNo: activeBooking.booking_no || activeBooking.bookingNo,
              courtId: activeBooking.court_id || activeBooking.courtId,
              bookingType: activeBooking.booking_type || activeBooking.bookingType,
              memberId: memberIdVal || null,
              memberName: resolvedName,
              memberPhone: activeBooking.member_phone || activeBooking.memberPhone || guestPhone || null,
              memberEmail: activeBooking.member_email || activeBooking.memberEmail || null,
              memberCode: activeBooking.member_code || activeBooking.memberCode || null,
              planName: activeBooking.plan_name || activeBooking.planName || null,
              planCode: activeBooking.plan_code || activeBooking.planCode || null,
              guestName: guestName || null,
              guestPhone: guestPhone || null,
              status: activeBooking.status || 'confirmed',
              paymentStatus: activeBooking.payment_status || activeBooking.paymentStatus || 'unpaid',
              price: Number(activeBooking.price ?? 0),
              title: activeBooking.title || null,
              startAt: activeBooking.start_at || activeBooking.startAt,
              endAt: activeBooking.end_at || activeBooking.endAt,
            }
          }

          if (state === 'social' && activeSocial) {
            const participants = memoryStore.find(
              'booking_participants',
              (p) => p.session_id === activeSocial.id && p.status === 'joined'
            )
            slotData.social = {
              sessionId: activeSocial.id,
              capacity: activeSocial.capacity,
              joined: participants.length,
              spotsLeft: Math.max(0, activeSocial.capacity - participants.length),
            }
          }

          return slotData
        })

        return {
          courtId: court.id,
          courtName: court.name,
          sport: court.sport,
          ratePerHour: Number(court.rate_per_hour),
          slots,
        }
      })
    )

    return {
      date,
      courts: courtAvailability,
    }
  },

  /**
   * Public free slots aggregator (no PII, 7-14 days).
   */
  async getFreeSlots({ from = toClubDate(), days = 7, sport = null }) {
    const maxDays = Math.min(Number(days) || 7, 14)
    const resultDays = []

    const fromDate = new Date(from)

    for (let i = 0; i < maxDays; i++) {
      const current = new Date(fromDate)
      current.setDate(current.getDate() + i)
      const dateStr = toClubDate(current)

      const dayAvail = await this.getAvailability({
        date: dateStr,
        sport,
        isStaff: false,
      })

      const courtEntries = dayAvail.courts.map((c) => ({
        courtId: c.courtId,
        name: c.courtName,
        sport: c.sport,
        walkInRate: c.ratePerHour,
        freeSlots: c.slots.filter((s) => s.state === 'available').map((s) => s.time),
        socialSessions: c.slots.filter((s) => s.state === 'social').map((s) => s.time),
      }))

      resultDays.push({
        date: dateStr,
        courts: courtEntries,
      })
    }

    return { days: resultDays }
  },
}

export default availabilityService
