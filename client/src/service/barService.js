import api from './api'

export const barService = {
  async getMenu(params = {}) {
    const res = await api.get('/bar/menu', { params })
    return res.data || []
  },

  async updateMenuItem(id, data) {
    const res = await api.patch(`/bar/menu/${id}`, data)
    return res.data
  },

  async getTables() {
    const res = await api.get('/bar/tables')
    return res.data || []
  },

  async getTabs(params = {}) {
    const res = await api.get('/bar/tabs', { params })
    return res.data || []
  },

  async getTabById(id) {
    const res = await api.get(`/bar/tabs/${id}`)
    return res.data
  },

  async openTab(data) {
    const res = await api.post('/bar/tabs', data)
    return res.data
  },

  async addTabItems(tabId, items) {
    const res = await api.post(`/bar/tabs/${tabId}/items`, { items })
    return res.data
  },

  async updateTabItem(tabId, itemId, data) {
    const res = await api.patch(`/bar/tabs/${tabId}/items/${itemId}`, data)
    return res.data
  },

  async updateTabMember(tabId, memberId) {
    const res = await api.patch(`/bar/tabs/${tabId}/member`, { memberId })
    return res.data
  },

  async updateTabTable(tabId, tableId) {
    const res = await api.patch(`/bar/tabs/${tabId}/table`, { tableId })
    return res.data
  },

  async settleTab(tabId, payments) {
    const res = await api.post(`/bar/tabs/${tabId}/settle`, { payments })
    return res.data
  },

  async voidTab(tabId, reason) {
    const res = await api.post(`/bar/tabs/${tabId}/void`, { reason })
    return res.data
  },

  async getKitchenQueue(params = {}) {
    const res = await api.get('/bar/kitchen', { params })
    return res.data || []
  },

  async updateKitchenStatus(itemId, status) {
    const res = await api.patch(`/bar/items/${itemId}/kitchen-status`, { status })
    return res.data
  },

  async getBarSummary(date) {
    const res = await api.get('/bar/summary', { params: { date } })
    return res.data
  },
}

export default barService
