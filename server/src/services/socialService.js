import socialRepository from '../repositories/socialRepository.js'
import bookingRepository from '../repositories/bookingRepository.js'
import courtRepository from '../repositories/courtRepository.js'
import membershipService from './membershipService.js'
import paymentsService from './paymentsService.js'
import ApiError from '../utils/ApiError.js'
import { toClubDate, parseClubDateTime, localDayRange } from '../utils/clubTime.js'
import { round2, calcInclusiveTax } from '../utils/money.js'

export const socialService = {
  async list(filters) {
    const sessions = await socialRepository.listSessions(filters)
    return Promise.all(
      sessions.map(async (s) => {
        const participants = await socialRepository.getParticipants(s.id)
        return {
          id: s.id,
          bookingNo: s.booking_no,
          courtId: s.court_id,
          title: s.title,
          startAt: s.start_at,
          endAt: s.end_at,
          status: s.status,
          capacity: s.capacity,
          joined: participants.length,
          spotsLeft: Math.max(0, s.capacity - participants.length),
          pricePerHead: Number(s.price_per_head),
        }
      })
    )
  },

  async create({ courtId, title, startAt, capacity = 8, pricePerHead = 250, notes = null, actorId = null }) {
    const start = new Date(startAt)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const startIso = start.toISOString()
    const endIso = end.toISOString()

    // Conflict check
    const overlapping = await bookingRepository.findOverlapping(courtId, startIso, endIso)
    if (overlapping.length > 0) {
      throw new ApiError(409, 'That court slot is already booked', null, 'SLOT_TAKEN')
    }

    const session = await bookingRepository.insert({
      courtId,
      bookingType: 'social_session',
      title: title || 'Friday Social Play',
      startAt: startIso,
      endAt: endIso,
      status: 'confirmed',
      capacity: Number(capacity),
      pricePerHead: Number(pricePerHead),
      notes,
      source: 'staff_counter',
      createdBy: actorId,
    })

    return session
  },

  async generate({ date, courtIds = [], startTime = '18:00', endTime = '22:00', capacity = 8, pricePerHead = 250, actorId }) {
    const created = []
    const skipped = []

    const courts = await courtRepository.list({ isActive: true })
    const targetCourts = courtIds.length ? courts.filter((c) => courtIds.includes(c.id)) : courts

    const [startH] = startTime.split(':').map(Number)
    const [endH] = endTime.split(':').map(Number)

    for (const court of targetCourts) {
      for (let h = startH; h < endH; h++) {
        const timeStr = `${String(h).padStart(2, '0')}:00`
        const slotStart = parseClubDateTime(date, timeStr)
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)
        const startIso = slotStart.toISOString()
        const endIso = slotEnd.toISOString()

        const overlapping = await bookingRepository.findOverlapping(court.id, startIso, endIso)
        if (overlapping.length > 0) {
          skipped.push({
            courtId: court.id,
            start: startIso,
            reason: 'SLOT_TAKEN',
          })
          continue
        }

        const session = await bookingRepository.insert({
          courtId: court.id,
          bookingType: 'social_session',
          title: `Friday Social (${court.name})`,
          startAt: startIso,
          endAt: endIso,
          status: 'confirmed',
          capacity: Number(capacity),
          pricePerHead: Number(pricePerHead),
          source: 'staff_counter',
          createdBy: actorId,
        })
        created.push(session)
      }
    }

    return { created, skipped }
  },

  async join(sessionId, { memberId = null, guestName = null, paymentMethod = 'cash', actorId = null }) {
    const session = await socialRepository.findSessionById(sessionId)
    if (!session || session.status === 'cancelled') {
      throw new ApiError(404, 'Social session not found or cancelled', null, 'NOT_FOUND')
    }

    const participants = await socialRepository.getParticipants(sessionId)
    if (participants.length >= session.capacity) {
      throw new ApiError(422, 'Session is full', null, 'SESSION_FULL')
    }

    if (memberId) {
      const alreadyJoined = participants.some((p) => p.member_id === memberId)
      if (alreadyJoined) {
        throw new ApiError(409, 'Member has already joined this session', null, 'ALREADY_JOINED')
      }

      // Check daily limit (BR-03: counts regular + joined social sessions)
      const startDate = new Date(session.start_at)
      const localDateStr = toClubDate(startDate)
      const { startIso, endIso } = localDayRange(localDateStr)
      const dailyCount = await bookingRepository.countMemberSessionsOnDate(memberId, startIso, endIso)
      const activeMembership = await membershipService.getActive(memberId, startDate)
      const maxDaily = activeMembership?.max_bookings_per_day || 2

      if (dailyCount >= maxDaily) {
        throw new ApiError(422, `Daily session limit of ${maxDaily} reached`, null, 'DAILY_LIMIT_REACHED')
      }
    }

    const basePrice = Number(session.price_per_head) || 0
    let discountPct = 0
    if (memberId) {
      discountPct = await membershipService.discountFor(memberId, 'court', new Date(session.start_at))
    }

    const price = round2(basePrice * (1 - discountPct / 100))
    const taxAmount = calcInclusiveTax(price, 18)
    const paymentStatus = price === 0 ? 'waived' : 'paid'

    const participant = await socialRepository.addParticipant({
      sessionId,
      memberId,
      guestName,
      basePrice,
      discountPct,
      price,
      taxAmount,
      paymentStatus,
      createdBy: actorId,
    })

    if (price > 0 && paymentMethod !== 'pay_at_club') {
      await paymentsService.record({
        sourceType: 'social_join',
        sourceId: participant.id,
        amount: price,
        method: paymentMethod,
        category: 'court',
        revenueCategory: 'court',
        memberId,
        receivedBy: actorId,
        taxAmount,
        status: 'paid',
      })
    }

    return participant
  },

  async leave(sessionId, participantId, actorId) {
    const participant = await socialRepository.updateParticipant(participantId, {
      status: 'cancelled',
      updated_by: actorId,
    })
    if (!participant) throw new ApiError(404, 'Participant not found', null, 'NOT_FOUND')
    return participant
  },

  async cancel(sessionId, _actorId) {
    const session = await socialRepository.findSessionById(sessionId)
    if (!session) throw new ApiError(404, 'Session not found', null, 'NOT_FOUND')

    const updated = await bookingRepository.update(sessionId, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })

    // Mark joined participants refund_pending
    const participants = await socialRepository.getParticipants(sessionId)
    for (const p of participants) {
      await socialRepository.updateParticipant(p.id, {
        status: 'cancelled',
        payment_status: 'refund_pending',
      })
    }

    return updated
  },
}

export default socialService
