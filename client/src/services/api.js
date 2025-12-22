import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
};

// Shipment APIs
export const shipmentAPI = {
  getAll: (params) => api.get('/api/shipments', { params }),
  getById: (id) => api.get(`/api/shipments/${id}`),
  create: (data) => api.post('/api/shipments', data),
  update: (id, data) => api.put(`/api/shipments/${id}`, data),
  delete: (id) => api.delete(`/api/shipments/${id}`),
  track: (trackingNumber) => api.get(`/api/track/${trackingNumber}`),
};

// Admin APIs
export const adminAPI = {
  getAllUsers: () => api.get('/api/admin/users'),
  getAllDrivers: () => api.get('/api/admin/drivers'),
  promoteToDriver: (userId, data) => api.post(`/api/admin/users/${userId}/promote-driver`, data),
  demoteDriver: (userId) => api.post(`/api/admin/users/${userId}/demote-driver`),
  assignDriver: (shipmentId, driverId) => api.post(`/api/admin/shipments/${shipmentId}/assign`, { driverId }),
  toggleUserStatus: (userId) => api.patch(`/api/admin/users/${userId}/toggle`),
};

// Driver APIs
export const driverAPI = {
  getMyShipments: (params) => api.get('/api/driver/shipments', { params }),
  updateStatus: (shipmentId, status) => api.put(`/api/driver/shipments/${shipmentId}/status`, { status }),
  updateLocation: (data) => api.post('/api/driver/location', data),
  addNotes: (shipmentId, notes) => api.put(`/api/driver/shipments/${shipmentId}/notes`, { notes }),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/api/shipments/analytics'),
  getPerDay: () => api.get('/api/shipments/analytics/per-day'),
};

// Tasks APIs
export const tasksAPI = {
  getAll: () => api.get('/api/tasks'),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/api/tasks/${id}/status`, { status }),
};

export default api;