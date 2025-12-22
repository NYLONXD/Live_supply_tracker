// client/src/utils/helpers.js
import { format, formatDistance, formatRelative } from 'date-fns';

// Date Formatting
export function formatDate(date, pattern = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  return format(new Date(date), pattern);
}

export function formatDateTime(date, pattern = 'MMM dd, yyyy HH:mm') {
  if (!date) return 'N/A';
  return format(new Date(date), pattern);
}

export function formatTimeAgo(date) {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  return formatRelative(new Date(date), new Date());
}

// Number Formatting
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

// Distance Calculation (Haversine formula)
export function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// String Formatting
export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Status Formatting
export function formatStatus(status) {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ').toUpperCase();
}

export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    assigned: 'blue',
    picked_up: 'cyan',
    in_transit: 'purple',
    delivered: 'green',
    cancelled: 'red',
  };
  return colors[status] || 'gray';
}

// ETA Formatting
export function formatETA(minutes) {
  if (!minutes || minutes < 0) return 'N/A';
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
}

// Array Helpers
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
}

export function unique(array, key) {
  if (key) {
    const seen = new Set();
    return array.filter((item) => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  return [...new Set(array)];
}

// Object Helpers
export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

// Debounce
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Download File
export function downloadFile(data, filename, type = 'text/csv') {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Copy to Clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Generate Tracking Number
export function generateTrackingNumber() {
  const prefix = 'TRK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Validate Email
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Phone
export function isValidPhone(phone) {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return re.test(phone);
}

// Get Initials
export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}