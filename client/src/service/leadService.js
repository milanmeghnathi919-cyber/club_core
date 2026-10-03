import api from './api'

export const leadService = {
  async getLeads(params = {}) {
    const res = await api.get('/leads', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getLeadById(id) {
    const res = await api.get(`/leads/${id}`)
    return res.data
  },

  async createLead(data) {
    const res = await api.post('/leads', data)
    return res.data
  },

  async updateLead(id, data) {
    const res = await api.patch(`/leads/${id}`, data)
    return res.data
  },

  async getFollowUps(due = 'today') {
    const res = await api.get('/leads/follow-ups', { params: { due } })
    return res.data || []
  },

  async addActivity(leadId, data) {
    const res = await api.post(`/leads/${leadId}/activities`, data)
    return res.data
  },

  async createQuote(leadId, data) {
    const res = await api.post(`/leads/${leadId}/quotes`, data)
    return res.data
  },

  async convertLead(leadId, data) {
    const res = await api.post(`/leads/${leadId}/convert`, data)
    return res.data
  },
}

export default leadService
