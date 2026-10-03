import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const socialRepository = {
  async listSessions({ from, to } = {}) {
    let items = memoryStore.find('bookings', (b) => b.booking_type === 'social_session')
    if (from) items = items.filter((b) => b.start_at >= from)
    if (to) items = items.filter((b) => b.start_at <= to)
    items.sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
    return items
  },

  async findSessionById(id) {
    return memoryStore.findOne('bookings', (b) => b.id === id && b.booking_type === 'social_session')
  },

  async getParticipants(sessionId) {
    return memoryStore.find('booking_participants', (p) => p.session_id === sessionId && p.status === 'joined')
  },

  async addParticipant(data) {
    return memoryStore.insert('booking_participants', {
      id: data.id || crypto.randomUUID(),
      session_id: data.sessionId,
      member_id: data.memberId || null,
      guest_name: data.guestName || null,
      status: 'joined',
      base_price: Number(data.basePrice || 0),
      discount_pct: Number(data.discountPct || 0),
      price: Number(data.price || 0),
      tax_amount: Number(data.taxAmount || 0),
      payment_status: data.paymentStatus || 'paid',
      joined_at: new Date().toISOString(),
      created_by: data.createdBy || null,
    })
  },

  async updateParticipant(id, updates) {
    return memoryStore.update('booking_participants', (p) => p.id === id, updates)
  },
}

export default socialRepository
