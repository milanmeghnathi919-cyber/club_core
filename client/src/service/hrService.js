import api from './api'

export const hrService = {
  async getEmployees() {
    const res = await api.get('/employees')
    return res.data || []
  },

  async createEmployee(data) {
    const res = await api.post('/employees', data)
    return res.data
  },

  async updateEmployee(id, data) {
    const res = await api.patch(`/employees/${id}`, data)
    return res.data
  },

  async getShifts(params = {}) {
    const res = await api.get('/shifts', { params })
    return res.data || []
  },

  async createShift(data) {
    const res = await api.post('/shifts', data)
    return res.data
  },

  async updateShift(id, data) {
    const res = await api.patch(`/shifts/${id}`, data)
    return res.data
  },

  async deleteShift(id) {
    const res = await api.delete(`/shifts/${id}`)
    return res.data
  },

  async checkInShift(id) {
    const res = await api.post(`/shifts/${id}/check-in`)
    return res.data
  },

  async checkOutShift(id) {
    const res = await api.post(`/shifts/${id}/check-out`)
    return res.data
  },

  async getLeaveRequests(params = {}) {
    const res = await api.get('/leave-requests', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getMyLeaveRequests() {
    const res = await api.get('/leave-requests/mine')
    return res.data || []
  },

  async submitLeaveRequest(data) {
    const res = await api.post('/leave-requests', data)
    return res.data
  },

  async decideLeaveRequest(id, decision, note) {
    const res = await api.patch(`/leave-requests/${id}/decision`, { decision, note })
    return res.data
  },

  async getPayrollRuns() {
    const res = await api.get('/payroll/runs')
    return res.data || []
  },

  async getPayrollRunById(id) {
    const res = await api.get(`/payroll/runs/${id}`)
    return res.data
  },

  async createPayrollRun(month) {
    const res = await api.post('/payroll/runs', { month })
    return res.data
  },

  async updatePayslip(id, data) {
    const res = await api.patch(`/payroll/payslips/${id}`, data)
    return res.data
  },

  async finalizePayrollRun(id) {
    const res = await api.post(`/payroll/runs/${id}/finalize`)
    return res.data
  },

  async markPayrollPaid(id, method = 'bank_transfer') {
    const res = await api.post(`/payroll/runs/${id}/mark-paid`, { method })
    return res.data
  },

  async getSettings() {
    const res = await api.get('/settings')
    return res.data
  },

  async updateSettings(data) {
    const res = await api.patch('/settings', data)
    return res.data
  },
}

export default hrService
