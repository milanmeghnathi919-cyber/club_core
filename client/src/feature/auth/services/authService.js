import api from '@/service/api'

// server responses are `{ success, data }`, so unwrap to data
const unwrap = (promise) => promise.then((r) => r.data.data)

export const login = (payload) => unwrap(api.post('/auth/login', payload))

export const register = (payload) => unwrap(api.post('/auth/register', payload))

export const logout = () => api.post('/auth/logout').then((r) => r.data)