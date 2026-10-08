import memoryStore from '../utils/memoryStore.js'

export const leadRepository = {
  async insert(data) {
    return memoryStore.insert('leads', {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || 'website',
      interest: data.interest || 'membership',
      plan_id: data.planId || data.plan_id || null,
      sport: data.sport || null,
      preferred_date: data.preferredDate || data.preferred_date || null,
      message: data.message || null,
      status: data.status || 'new',
      assigned_to: data.assignedTo || data.assigned_to || null,
      follow_up_at: data.followUpAt || data.follow_up_at || null,
      converted_member_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  },

  async findById(id) {
    const lead = memoryStore.findOne('leads', (l) => l.id === id)
    if (!lead) return null
    const activities = memoryStore.find('lead_activities', (a) => a.lead_id === id)
    const quotes = memoryStore.find('quotes', (q) => q.lead_id === id)
    return { ...lead, activities, quotes }
  },

  async list({ status, source, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    let items = memoryStore.find('leads')

    if (status) items = items.filter((l) => l.status === status)
    if (source) items = items.filter((l) => l.source === source)

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    }
  },

  async getFollowUps() {
    return memoryStore.find('leads', (l) => l.follow_up_at && l.status !== 'won' && l.status !== 'lost')
  },

  async update(id, updates) {
    return memoryStore.update('leads', (l) => l.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    })
  },

  async addActivity(data) {
    return memoryStore.insert('lead_activities', {
      id: data.id || crypto.randomUUID(),
      lead_id: data.leadId || data.lead_id,
      type: data.type || 'note',
      text: data.text,
      follow_up_at: data.followUpAt || data.follow_up_at || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async addQuote(data) {
    return memoryStore.insert('quotes', {
      id: data.id || crypto.randomUUID(),
      lead_id: data.leadId || data.lead_id,
      plan_id: data.planId || data.plan_id || null,
      amount: Number(data.amount || 0),
      notes: data.notes || null,
      valid_until: data.validUntil || data.valid_until || null,
      status: data.status || 'draft',
      sent_at: data.sentAt || data.sent_at || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },
}

export default leadRepository
