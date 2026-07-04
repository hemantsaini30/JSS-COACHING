import axios from 'axios'

const PUBLIC_API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

export const submitInquiry = (data) => PUBLIC_API.post('/api/public/inquiry', data)