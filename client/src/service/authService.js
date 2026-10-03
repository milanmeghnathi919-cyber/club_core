import api from './api'

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    if (res?.data?.token) {
      localStorage.setItem('cc_token', res.data.token)
      localStorage.setItem('cc_user', JSON.stringify(res.data.user))
    }
    return res.data
  },

  async register(data) {
    const res = await api.post('/auth/register', data)
    if (res?.data?.token) {
      localStorage.setItem('cc_token', res.data.token)
      localStorage.setItem('cc_user', JSON.stringify(res.data.user))
    }
    return res.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('cc_token')
      localStorage.removeItem('cc_user')
    }
  },

  async me() {
    const res = await api.get('/auth/me')
    return res.data
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.patch('/auth/password', { currentPassword, newPassword })
    return res.data
  },
}

export default authService
