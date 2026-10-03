import api from './api'

export const memberService = {
  async getMembers(params = {}) {
    const res = await api.get('/members', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async lookupMembers(q) {
    if (!q || q.length < 2) return []
    const res = await api.get('/members/lookup', { params: { q } })
    return res.data || []
  },

  async getMemberById(id) {
    const res = await api.get(`/members/${id}`)
    return res.data
  },

  async createMember(data) {
    const res = await api.post('/members', data)
    return res.data
  },

  async updateMember(id, data) {
    const res = await api.patch(`/members/${id}`, data)
    return res.data
  },

  async getMemberHistory(id, params = {}) {
    const res = await api.get(`/members/${id}/history`, { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getPlans() {
    const res = await api.get('/plans')
    return res.data || []
  },

  async addMembership(memberId, data) {
    const res = await api.post(`/members/${memberId}/memberships`, data)
    return res.data
  },

  async cancelMembership(membershipId) {
    const res = await api.patch(`/memberships/${membershipId}/cancel`)
    return res.data
  },
}

export default memberService
