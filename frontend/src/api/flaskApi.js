import axios from 'axios'

const flaskAPI = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL ? `${import.meta.env.VITE_FLASK_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000
})

flaskAPI.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default flaskAPI
