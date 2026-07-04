import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('instora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('instora_token')
      localStorage.removeItem('instora_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const loginUser = (credentials) => API.post('/api/auth/login', credentials)

export default API