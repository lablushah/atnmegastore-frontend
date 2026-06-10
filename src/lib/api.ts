import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-clear stale auth on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth-storage');
    }
    return Promise.reject(err);
  }
);

export default api;
