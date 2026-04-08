// client/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      const hasSessionUser = Boolean(localStorage.getItem('user'));
      if (hasSessionUser && !['/', '/login', '/track', '/verify-email'].includes(window.location.pathname)) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:               (data)        => api.post('/api/auth/login', data),
  register:            (data)        => api.post('/api/auth/register', data),
  registerOrganization:(data)        => api.post('/api/organizations/register', data),
  getMe:               ()            => api.get('/api/auth/me'),
  forgotPassword:      (data)        => api.post('/api/auth/forgot-password', data),
  resetPassword:       (token, data) => api.post(`/api/auth/reset-password/${token}`, data),
  logout:              ()            => api.post('/api/auth/logout'),
  verifyEmail:         (data)        => api.post('/api/auth/verify-email', data),
  resendOTP:           ()            => api.post('/api/auth/resend-otp'),
  updateProfile:       (data)        => api.put('/api/auth/profile', data),
};

// ─── Shipments ────────────────────────────────────────────────────────────────
export const shipmentAPI = {
  getAll:   (params)         => api.get('/api/shipments', { params }),
  getById:  (id)             => api.get(`/api/shipments/${id}`),
  create:   (data)           => api.post('/api/shipments', data),
  update:   (id, data)       => api.put(`/api/shipments/${id}`, data),
  delete:   (id)             => api.delete(`/api/shipments/${id}`),
  track:    (trackingNumber) => api.get(`/api/track/${trackingNumber}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAllUsers:       ()                     => api.get('/api/admin/users'),
  getAllDrivers:     ()                     => api.get('/api/admin/drivers'),
  promoteToDriver:  (userId, data)         => api.post(`/api/admin/users/${userId}/promote-driver`, data),
  demoteDriver:     (userId)               => api.post(`/api/admin/users/${userId}/demote-driver`),
  assignDriver:     (shipmentId, driverId) => api.post(`/api/admin/shipments/${shipmentId}/assign`, { driverId }),
  toggleUserStatus: (userId)               => api.patch(`/api/admin/users/${userId}/toggle`),
};

// ─── Invites ──────────────────────────────────────────────────────────────────
export const inviteAPI = {
  create:   (data)        => api.post('/api/invites', data),
  getAll:   ()            => api.get('/api/invites'),
  revoke:   (token)       => api.delete(`/api/invites/${token}`),
  validate: (token)       => api.get(`/api/invites/${token}/validate`),
  accept:   (token, data) => api.post(`/api/invites/${token}/accept`, data),
};

// ─── Driver ───────────────────────────────────────────────────────────────────
export const driverAPI = {
  getMyShipments: (params)             => api.get('/api/driver/shipments', { params }),
  updateStatus:   (shipmentId, status) => api.put(`/api/driver/shipments/${shipmentId}/status`, { status }),
  updateLocation: (data)               => api.post('/api/driver/location', data),
  addNotes:       (shipmentId, notes)  => api.put(`/api/driver/shipments/${shipmentId}/notes`, { notes }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: () => api.get('/api/analytics'),
  getPerDay:   () => api.get('/api/analytics/per-day'),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:       ()           => api.get('/api/tasks'),
  create:       (data)       => api.post('/api/tasks', data),
  update:       (id, data)   => api.put(`/api/tasks/${id}`, data),
  delete:       (id)         => api.delete(`/api/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/api/tasks/${id}/status`, { status }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  previewETA: (data) => api.post('/api/ai/preview-eta', data),
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const organizationAPI = {
  getMyOrg:    ()     => api.get('/api/organizations/me'),
  updateMyOrg: (data) => api.put('/api/organizations/me', data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:       (params) => api.get('/api/notifications', { params }),
  getUnreadCount: ()     => api.get('/api/notifications/unread-count'),
  markRead:     (id)     => api.patch(`/api/notifications/${id}/read`),
  markAllRead:  ()       => api.patch('/api/notifications/read-all'),
  delete:       (id)     => api.delete(`/api/notifications/${id}`),
  clearRead:    ()       => api.delete('/api/notifications'),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportAPI = {
  createTicket:  (data)        => api.post('/api/support', data),
  getAll:        (params)      => api.get('/api/support', { params }),
  getTicket:     (id)          => api.get(`/api/support/${id}`),
  reply:         (id, content) => api.post(`/api/support/${id}/reply`, { content }),
  updateStatus:  (id, status)  => api.patch(`/api/support/${id}/status`, { status }),
  rateTicket:    (id, rating)  => api.patch(`/api/support/${id}/rate`, { rating }),
  getShipments:  ()            => api.get('/api/support/shipments'),
  getStats:      ()            => api.get('/api/support/stats'),
};

export default api;