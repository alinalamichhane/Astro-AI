import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s — prevents silent hangs
})

// ── Request: attach access token ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response: auto-refresh on 401, normalise errors ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Token expired → try refresh once
    // Skip this for the login endpoint — a 401 there means bad credentials,
    // not an expired session, and we must NOT try to refresh.
    const isLoginEndpoint = original.url?.includes('/auth/login/')
    if (error.response?.status === 401 && !original._retry && !isLoginEndpoint) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          const { data } = await axios.post(
            '/api/v1/auth/token/refresh/',
            { refresh },
            { timeout: 10000 }
          )
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          // Refresh failed — clear session and redirect
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          // Clear Zustand store without importing it (avoids circular deps)
          window.dispatchEvent(new Event('auth:logout'))
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // 403 — permission denied, no retry needed
    if (error.response?.status === 403) {
      return Promise.reject(error)
    }

    // 429 — rate limited
    if (error.response?.status === 429) {
      return Promise.reject(error)
    }

    // Network error (no response at all)
    if (!error.response) {
      error.isNetworkError = true
    }

    return Promise.reject(error)
  }
)

export default api
