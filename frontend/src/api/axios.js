// Axios instance configured to talk to the Django backend
// All API calls in the app use this instead of plain axios

import axios from 'axios'

// Set the base URL so we don't repeat it in every API call
const api = axios.create({ baseURL: 'http://localhost:8000/api' })

// Before every request, attach the JWT token from localStorage to the Authorization header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the server returns 401 (token expired), redirect to login — but NOT for the login endpoint itself
// so that wrong-password errors are shown to the user instead of silently redirecting
api.interceptors.response.use(
  res => res,
  async err => {
    const isLoginCall = err.config?.url?.includes('/auth/login/')
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
