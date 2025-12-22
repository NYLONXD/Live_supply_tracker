// client/src/utils/constants.js

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoibnlsb254ZCIsImEiOiJjbWJ6ZndlbmUxdWh4MmxzMXVlNHo1bHY4In0.skucR8Fy2ydShwGEp7kvwQ';

// User Roles
export const ROLES = {
  USER: 'user',
  DRIVER: 'driver',
  ADMIN: 'admin',
};

// Shipment Status
export const SHIPMENT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Status Flow (for progression)
export const STATUS_FLOW = {
  pending: 'assigned',
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

// Status Colors
export const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  assigned: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  picked_up: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  in_transit: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  delivered: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

// Vehicle Types
export const VEHICLE_TYPES = [
  { value: 'Car', label: '🚗 Car', icon: '🚗' },
  { value: 'Bike', label: '🏍️ Bike', icon: '🏍️' },
  { value: 'Truck', label: '🚛 Truck', icon: '🚛' },
  { value: 'Van', label: '🚐 Van', icon: '🚐' },
];

// Weather Conditions
export const WEATHER_CONDITIONS = [
  { value: 'Clear', label: '☀️ Clear', icon: '☀️' },
  { value: 'Rainy', label: '🌧️ Rainy', icon: '🌧️' },
  { value: 'Foggy', label: '🌫️ Foggy', icon: '🌫️' },
  { value: 'Snowy', label: '❄️ Snowy', icon: '❄️' },
];

// Time Intervals
export const REFRESH_INTERVALS = {
  LOCATION: 5000, // 5 seconds
  SHIPMENT: 10000, // 10 seconds
  ANALYTICS: 30000, // 30 seconds
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [77.1025, 28.7041], // Delhi, India
  DEFAULT_ZOOM: 12,
  MARKER_COLORS: {
    pickup: '#10b981', // green
    delivery: '#ef4444', // red
    current: '#8b5cf6', // purple
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
};

// Toast Configuration
export const TOAST_CONFIG = {
  duration: 3000,
  style: {
    background: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #475569',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#f1f5f9',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f1f5f9',
    },
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully',
  SHIPMENT_CREATED: 'Shipment created successfully',
  SHIPMENT_UPDATED: 'Shipment updated successfully',
  SHIPMENT_DELETED: 'Shipment deleted successfully',
  STATUS_UPDATED: 'Status updated successfully',
  DRIVER_ASSIGNED: 'Driver assigned successfully',
};