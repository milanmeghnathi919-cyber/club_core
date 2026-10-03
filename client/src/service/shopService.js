import api from './api'

export const shopService = {
  async getProducts(params = {}) {
    const res = await api.get('/products', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getProductById(id) {
    const res = await api.get(`/public/products/${id}`)
    return res.data
  },

  async getCategories() {
    const res = await api.get('/categories')
    return res.data || []
  },

  async getLowStock() {
    const res = await api.get('/products/low-stock')
    return res.data || []
  },

  async createProduct(data) {
    const res = await api.post('/products', data)
    return res.data
  },

  async updateProduct(id, data) {
    const res = await api.patch(`/products/${id}`, data)
    return res.data
  },

  async adjustStock(id, data) {
    const res = await api.post(`/products/${id}/stock`, data)
    return res.data
  },

  async getProductMovements(id) {
    const res = await api.get(`/products/${id}/movements`)
    return res.data || []
  },

  async getQuote(data) {
    const res = await api.post('/shop/orders/quote', data)
    return res.data
  },

  async createOrder(data) {
    const res = await api.post('/shop/orders', data)
    return res.data
  },

  async getOrders(params = {}) {
    const res = await api.get('/shop/orders', { params })
    return {
      items: res.data || [],
      meta: res.meta || {},
    }
  },

  async getMyOrders(params = {}) {
    const res = await api.get('/shop/orders/mine', { params })
    return res.data || []
  },

  async getOrderById(id) {
    const res = await api.get(`/shop/orders/${id}`)
    return res.data
  },

  async updateOrderStatus(id, status) {
    const res = await api.patch(`/shop/orders/${id}/status`, { status })
    return res.data
  },

  async payOrder(id, method) {
    const res = await api.post(`/shop/orders/${id}/pay`, { method })
    return res.data
  },

  async cancelOrder(id, reason) {
    const res = await api.patch(`/shop/orders/${id}/cancel`, { reason })
    return res.data
  },
}

export default shopService
