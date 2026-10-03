import axios from 'axios'

// Support both /api/v1 (recommended) and /api proxy
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auto-attach stored token if cookie is blocked in dev/cross-site
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const errorData = error.response?.data?.error || {}
    let message = errorData.message || error.response?.data?.message || error.message || 'Something went wrong'
    const code = errorData.code || 'UNKNOWN_ERROR'
    const details = errorData.details || []

    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      message = 'Unable to connect to backend server. Please ensure the API is running on port 5000.'
    }

    if (error.response?.status === 401) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      // Don't auto-redirect if user is deliberately trying to sign in or register
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('cc_token')
        localStorage.removeItem('cc_user')
        if (currentPath.startsWith('/app') || currentPath.startsWith('/staff') || currentPath.startsWith('/owner')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
      }
    }

    const enhancedError = new Error(message)
    enhancedError.status = error.response?.status
    enhancedError.code = code
    enhancedError.details = details
    enhancedError.raw = error.response?.data

    return Promise.reject(enhancedError)
  },
)

export default api