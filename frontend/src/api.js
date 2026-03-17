import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smart-digital-management.onrender.com/api', // Render Production API
  // baseURL: 'http://localhost:5000/api', // Local Development API
});

// Add interceptor to include the JWT token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
