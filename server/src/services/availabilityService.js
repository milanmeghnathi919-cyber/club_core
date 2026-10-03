import courtRepository from '../repositories/courtRepository.js'
import settingsService from './settingsService.js'
import membershipService from './membershipService.js'
import memoryStore from '../utils/memoryStore.js'
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

    // Fetch bookings & social sessions for this day
    const allBookings = memoryStore.find(
      'bookings',
      (b) => b.status !== 'cancelled' && b.start_at >= startIso && b.start_at <= endIso
    )

    const socialSessions = memoryStore.find(
      'bookings',
      (b) => b.booking_type === 'social_session' && b.status !== 'cancelled' && b.start_at >= startIso && b.start_at <= endIso
    )

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
            slotData.bookingId = activeBooking.id
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
