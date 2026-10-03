import api from './api'

export const courtService = {
  async getCourts(includeInactive = false) {
    const res = await api.get('/courts', { params: { includeInactive } })
    return res.data
  },

  async getAvailability(params) {
    const res = await api.get('/courts/availability', { params })
    return res.data
  },

  async createBooking(data) {
    const res = await api.post('/bookings', data)
    return res.data
  },

  async getMyBookings(upcoming = false) {
    const res = await api.get('/bookings/mine', { params: { upcoming } })
    return res.data
  },

  async getAllBookings(params = {}) {
    const res = await api.get('/bookings', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getBookingById(id) {
    const res = await api.get(`/bookings/${id}`)
    return res.data
  },

  async cancelBooking(id, reason) {
    const res = await api.patch(`/bookings/${id}/cancel`, { reason })
    return res.data
  },

  async payBooking(id, method) {
    const res = await api.patch(`/bookings/${id}/pay`, { method })
    return res.data
  },

  async updateBookingStatus(id, status) {
    const res = await api.patch(`/bookings/${id}/status`, { status })
    return res.data
  },

  async getSocialSessions(params = {}) {
    const res = await api.get('/social-sessions', { params })
    return res.data
  },

  async joinSocialSession(id, data = {}) {
    const res = await api.post(`/social-sessions/${id}/join`, data)
    return res.data
  },

  async leaveSocialSession(id, participantId) {
    const res = await api.delete(`/social-sessions/${id}/participants/${participantId}`)
    return res.data
  },

  async generateSocialSessions(data) {
    const res = await api.post('/social-sessions/generate', data)
    return res.data
  },
}

export default courtService
