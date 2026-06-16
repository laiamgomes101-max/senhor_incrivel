import axios from 'axios'

const baseURL = import.meta.env.VITE_NODE_API_URL ? `${import.meta.env.VITE_NODE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize response errors for UI consumption
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    const message = data?.error || data?.message || err.message || 'Erro de comunicação com o servidor'
    const e = new Error(message)
    e.status = err.response?.status
    e.payload = data
    return Promise.reject(e)
  }
)

export default api