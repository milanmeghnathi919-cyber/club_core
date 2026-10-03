import api from './api'

export const financeService = {
  async getClients() {
    const res = await api.get('/clients')
    return res.data || []
  },

  async createClient(data) {
    const res = await api.post('/clients', data)
    return res.data
  },

  async getInvoices(params = {}) {
    const res = await api.get('/invoices', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async createInvoice(data) {
    const res = await api.post('/invoices', data)
    return res.data
  },

  async getInvoiceById(id) {
    const res = await api.get(`/invoices/${id}`)
    return res.data
  },

  async updateInvoiceStatus(id, status) {
    const res = await api.patch(`/invoices/${id}/status`, { status })
    return res.data
  },

  async recordInvoicePayment(id, data) {
    const res = await api.post(`/invoices/${id}/payments`, data)
    return res.data
  },

  async getExpenses(params = {}) {
    const res = await api.get('/expenses', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async createExpense(data) {
    const res = await api.post('/expenses', data)
    return res.data
  },

  async payExpense(id, data) {
    const res = await api.patch(`/expenses/${id}/pay`, data)
    return res.data
  },

  async getPayables() {
    const res = await api.get('/reports/payables')
    return res.data || { totalDue: 0, overdueAmount: 0, byCategory: {}, items: [] }
  },

  async getDashboardReport(range = 'month') {
    const res = await api.get('/reports/dashboard', { params: { range } })
    return res.data
  },

  async getRevenueReport(params = {}) {
    const res = await api.get('/reports/revenue', { params })
    return res.data || []
  },

  async getTaxReport(params = {}) {
    const res = await api.get('/reports/tax', { params })
    return res.data
  },
}

export default financeService
