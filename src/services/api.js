// Create/open hopeconnect-frontend/src/services/api.js
import axios from 'axios'; // This line requires 'axios' to be installed
import { API_BASE_URL } from '../config'; // Ensure config.js exists with this export

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hopeconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.error("API Error: 401 Unauthorized. Token may be invalid or expired.", data);
        // Consider logout:
        // localStorage.removeItem('hopeconnect_user');
        // localStorage.removeItem('hopeconnect_token');
        // if (window.location.pathname !== '/login') {
        //   window.location.href = '/login?sessionExpired=true';
        // }
      } else if (status === 403) {
        console.error("API Error: 403 Forbidden. User does not have permission.", data);
      } else if (status === 500) {
        console.error("API Error: 500 Internal Server Error.", data);
      }
    } else if (error.request) {
      console.error("API Error: No response received from server.", error.request);
    } else {
      console.error('API Error: Error setting up request.', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;