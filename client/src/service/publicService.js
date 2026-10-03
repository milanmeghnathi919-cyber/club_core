import api from './api'

export const publicService = {
  async getClubInfo() {
    const res = await api.get('/public/club')
    return res.data
  },

  async getPlans() {
    const res = await api.get('/public/plans')
    return res.data || []
  },

  async getCourts() {
    const res = await api.get('/public/courts')
    return res.data || []
  },

  async getAvailability(params = {}) {
    const res = await api.get('/public/availability', { params })
    return res.data
  },

  async getCategories() {
    const res = await api.get('/public/categories')
    return res.data || []
  },

  async getProducts(params = {}) {
    const res = await api.get('/public/products', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getProductById(id) {
    const res = await api.get(`/public/products/${id}`)
    return res.data
  },

  async submitEnquiry(data) {
    const res = await api.post('/public/enquiries', data)
    return res.data
  },

  async bookTrial(data) {
    const res = await api.post('/public/trial-bookings', data)
    return res.data
  },
}

export default publicService
