import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_FLASK_URL || import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://backend-plataforma-3h2p.onrender.com' : '');
const normalizedBaseUrl = rawBaseUrl
  ? rawBaseUrl.match(/^https?:\/\//i)
    ? rawBaseUrl
    : `https://${rawBaseUrl}`
  : '';
const baseURL = normalizedBaseUrl.replace(/\/api\/?$/, '');

const flaskClient = axios.create({
  baseURL,
  timeout: 8000
});


flaskClient.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['Content-Type'] && !config.headers['content-type'] && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Standardize response errors to provide friendly messages to the UI
flaskClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    const message = data?.error || data?.message || data?.msg || err.message || 'Erro de comunicação com o servidor'
    const e = new Error(message)
    e.status = err.response?.status
    e.payload = data
    return Promise.reject(e)
  }
)

export default flaskClient;