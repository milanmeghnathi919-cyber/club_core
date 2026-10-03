import bookingRepository from '../repositories/bookingRepository.js'
import courtRepository from '../repositories/courtRepository.js'
import memberRepository from '../repositories/memberRepository.js'
import membershipService from './membershipService.js'
import settingsService from './settingsService.js'
import paymentsService from './paymentsService.js'
import availabilityService from './availabilityService.js'
import ApiError from '../utils/ApiError.js'
import { toClubDate, formatClub, localDayRange } from '../utils/clubTime.js'

// Simple in-memory locking mutex for slot concurrency (T-B1)
const slotLocks = new Set()

export const bookingService = {
  async create({
    courtId,
    startAt,
    memberId = null,
    guestName = null,
    guestPhone = null,
    paymentMethod = 'pay_at_club',
    notes = null,
    source = 'staff_counter',
    actorId = null,
  }) {
    const settings = await settingsService.get()
    const openTime = settings.openTime || '06:00'
    const closeTime = settings.closeTime || '22:00'
    const bookingWindowDays = settings.bookingWindowDays || 14

    const startDate = new Date(startAt)
    if (isNaN(startDate.getTime())) {
      throw new ApiError(422, 'Invalid start date format', null, 'INVALID_SLOT')
    }

    const now = new Date()
    if (startDate < now) {
      throw new ApiError(422, 'Cannot book a slot in the past', null, 'PAST_SLOT')
    }

    // Check 14-day booking window
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + bookingWindowDays)
    if (startDate > maxDate) {
      throw new ApiError(422, `Booking exceeds ${bookingWindowDays}-day window`, null, 'INVALID_SLOT')
    }

    // Rule BR-01: Start on :00 or :30 in Asia/Kolkata
    const timeStr = formatClub(startDate, 'HH:mm')
    const [h, m] = timeStr.split(':').map(Number)
    if (m !== 0 && m !== 30) {
      throw new ApiError(422, 'Start time must be on the hour or half-hour (:00 or :30)', null, 'INVALID_SLOT')
    }

    // Within opening hours (e.g. 06:00 to 21:00 last start)
    const [openH, openM] = openTime.split(':').map(Number)
    const [closeH, closeM] = closeTime.split(':').map(Number)
    const startMins = h * 60 + m
    const openMins = openH * 60 + openM
    const lastStartMins = closeH * 60 + closeM - 60

    if (startMins < openMins || startMins > lastStartMins) {
      throw new ApiError(422, `Slot must be within opening hours (${openTime} to ${closeTime})`, null, 'INVALID_SLOT')
    }

    // Calculate endAt (exactly 60 minutes)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    const startIso = startDate.toISOString()
    const endIso = endDate.toISOString()

    const court = await courtRepository.findById(courtId)
    if (!court || !court.is_active) {
      throw new ApiError(404, 'Court not found or inactive', null, 'NOT_FOUND')
    }

    // Acquire slot lock
    const lockKey = `${courtId}:${startIso}`
    if (slotLocks.has(lockKey)) {
      throw new ApiError(409, 'That court slot is already booked', null, 'SLOT_TAKEN')
    }
    slotLocks.add(lockKey)

    try {
      // BR-02: Check court overlap
      const overlapping = await bookingRepository.findOverlapping(courtId, startIso, endIso)
      if (overlapping.length > 0) {
        throw new ApiError(409, 'That court slot is already booked', null, 'SLOT_TAKEN')
      }

      const warnings = []
      let member = null
      let activeMembership = null

      if (memberId) {
        member = await memberRepository.findById(memberId)
        if (!member) throw new ApiError(404, 'Member not found', null, 'NOT_FOUND')

        activeMembership = await membershipService.getActive(memberId, startDate)
        if (!activeMembership) {
          warnings.push('MEMBERSHIP_EXPIRED')
        }

        // BR-05: Check member overlap on different courts
        const memberOverlaps = await bookingRepository.findMemberOverlapping(memberId, startIso, endIso)
        if (memberOverlaps.length > 0) {
          throw new ApiError(409, 'You already have another booking at this time', null, 'MEMBER_OVERLAP')
        }

        // BR-03: Max daily bookings check
        const localDateStr = toClubDate(startDate)
        const { startIso: dayStart, endIso: dayEnd } = localDayRange(localDateStr)
        const dailyCount = await bookingRepository.countMemberSessionsOnDate(memberId, dayStart, dayEnd)
        const maxDaily = activeMembership?.max_bookings_per_day || 2

        if (dailyCount >= maxDaily) {
          throw new ApiError(
            422,
            `Daily limit of ${maxDaily} bookings reached for this date`,
            null,
            'DAILY_LIMIT_REACHED'
          )
        }
      } else {
        if (!guestName) {
          throw new ApiError(422, 'Guest name is required when not booking for a member', null, 'VALIDATION_ERROR')
        }
      }

      // BR-04: Calculate price quote
      const quote = await availabilityService.quoteCourtPrice(court, memberId, startDate)
      let paymentStatus = 'unpaid'
      if (quote.price === 0) {
        // Gold 100% discount is waived, no payment ledger row
        paymentStatus = 'waived'
      } else if (['cash', 'card', 'upi'].includes(paymentMethod)) {
        paymentStatus = 'paid'
      }

      const booking = await bookingRepository.insert({
        courtId,
        bookingType: 'regular',
        memberId,
        guestName,
        guestPhone,
        startAt: startIso,
        endAt: endIso,
        status: 'confirmed',
        basePrice: quote.basePrice,
        discountPct: quote.discountPct,
        price: quote.price,
        taxAmount: quote.taxAmount,
        paymentStatus,
        source,
        notes,
        createdBy: actorId,
      })

      // If paid immediately at counter, record in payments ledger
      if (paymentStatus === 'paid' && quote.price > 0) {
        await paymentsService.record({
          sourceType: 'booking',
          sourceId: booking.id,
          amount: quote.price,
          method: paymentMethod,
          category: 'court',
          revenueCategory: 'court',
          memberId,
          receivedBy: actorId,
          taxAmount: quote.taxAmount,
          status: 'paid',
        })
      }

      const response = { ...booking }
      if (warnings.length > 0) {
        response.warnings = warnings
      }
      return response
    } finally {
      slotLocks.delete(lockKey)
    }
  },

  async list(filters) {
    return bookingRepository.list(filters)
  },

  async get(id) {
    const booking = await bookingRepository.findById(id)
    if (!booking) throw new ApiError(404, 'Booking not found', null, 'NOT_FOUND')
    return booking
  },

  async cancel(id, { actorId, isStaff = false, reason = null } = {}) {
    const booking = await bookingRepository.findById(id)
    if (!booking) throw new ApiError(404, 'Booking not found', null, 'NOT_FOUND')
    if (booking.status === 'cancelled') return booking

    const settings = await settingsService.get()
    const cutoffHours = settings.cancelCutoffHours || 2

    // BR-09: Member cutoff check
    if (!isStaff) {
      const now = new Date()
      const start = new Date(booking.start_at)
      const diffHours = (start - now) / (1000 * 60 * 60)
      if (diffHours < cutoffHours) {
        throw new ApiError(
          422,
          `Cannot cancel less than ${cutoffHours} hours before start`,
          null,
          'CANCEL_WINDOW_PASSED'
        )
      }
    }

    let nextPaymentStatus = booking.payment_status
    if (booking.payment_status === 'paid') {
      nextPaymentStatus = 'refund_pending'
    }

    const updated = await bookingRepository.update(id, {
      status: 'cancelled',
      payment_status: nextPaymentStatus,
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })

    return updated
  },

  async pay(id, { method, actorId }) {
    const booking = await bookingRepository.findById(id)
    if (!booking) throw new ApiError(404, 'Booking not found', null, 'NOT_FOUND')

    if (booking.payment_status === 'paid' || booking.payment_status === 'waived') {
      return booking
    }

    await paymentsService.record({
      sourceType: 'booking',
      sourceId: booking.id,
      amount: booking.price,
      method,
      category: 'court',
      revenueCategory: 'court',
      memberId: booking.member_id,
      receivedBy: actorId,
      taxAmount: booking.tax_amount,
      status: 'paid',
    })

    return bookingRepository.update(id, { payment_status: 'paid' })
  },

  async updateStatus(id, status) {
    const booking = await bookingRepository.findById(id)
    if (!booking) throw new ApiError(404, 'Booking not found', null, 'NOT_FOUND')
    return bookingRepository.update(id, { status })
  },
}

export default bookingService
