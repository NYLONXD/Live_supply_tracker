// client/src/utils/validators.js

// Email Validation
export function validateEmail(email) {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
    return errors;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
}

// Password Validation
export function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (password.length > 50) {
    errors.push('Password must be less than 50 characters');
  }
  
  // Optional: Add more strict rules
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  
  // if (!/[0-9]/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  
  return errors;
}

// Phone Validation
export function validatePhone(phone) {
  const errors = [];
  
  if (!phone) {
    errors.push('Phone number is required');
    return errors;
  }
  
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phone)) {
    errors.push('Invalid phone number format');
  }
  
  return errors;
}

// Name Validation
export function validateName(name, fieldName = 'Name') {
  const errors = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  if (name.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters`);
  }
  
  if (name.length > 50) {
    errors.push(`${fieldName} must be less than 50 characters`);
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    errors.push(`${fieldName} can only contain letters and spaces`);
  }
  
  return errors;
}

// Location Validation
export function validateLocation(location, fieldName = 'Location') {
  const errors = [];
  
  if (!location) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  if (location.length < 3) {
    errors.push(`${fieldName} must be at least 3 characters`);
  }
  
  if (location.length > 200) {
    errors.push(`${fieldName} must be less than 200 characters`);
  }
  
  return errors;
}

// Coordinates Validation
export function validateCoordinates(lat, lng) {
  const errors = [];
  
  if (lat === undefined || lat === null) {
    errors.push('Latitude is required');
  } else if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (lng === undefined || lng === null) {
    errors.push('Longitude is required');
  } else if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  return errors;
}

// Shipment Validation
export function validateShipment(shipmentData) {
  const errors = {};
  
  // From location
  const fromErrors = validateLocation(shipmentData.from, 'Pickup location');
  if (fromErrors.length) errors.from = fromErrors;
  
  // To location
  const toErrors = validateLocation(shipmentData.to, 'Delivery location');
  if (toErrors.length) errors.to = toErrors;
  
  // From coordinates
  const fromCoordErrors = validateCoordinates(shipmentData.fromLat, shipmentData.fromLng);
  if (fromCoordErrors.length) errors.fromCoords = fromCoordErrors;
  
  // To coordinates
  const toCoordErrors = validateCoordinates(shipmentData.toLat, shipmentData.toLng);
  if (toCoordErrors.length) errors.toCoords = toCoordErrors;
  
  // Vehicle type
  if (!shipmentData.vehicleType) {
    errors.vehicleType = ['Vehicle type is required'];
  }
  
  // Weather
  if (!shipmentData.weather) {
    errors.weather = ['Weather condition is required'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Login Form Validation
export function validateLoginForm(formData) {
  const errors = {};
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length) errors.email = emailErrors[0];
  
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length) errors.password = passwordErrors[0];
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Signup Form Validation
export function validateSignupForm(formData) {
  const errors = {};
  
  const nameErrors = validateName(formData.displayName, 'Full name');
  if (nameErrors.length) errors.displayName = nameErrors[0];
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length) errors.email = emailErrors[0];
  
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length) errors.password = passwordErrors[0];
  
  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Driver Promotion Validation
export function validateDriverPromotion(data) {
  const errors = {};
  
  if (!data.vehicleInfo) {
    errors.vehicleInfo = 'Vehicle information is required';
  } else if (data.vehicleInfo.length < 3) {
    errors.vehicleInfo = 'Vehicle information must be at least 3 characters';
  }
  
  if (!data.vehicleNumber) {
    errors.vehicleNumber = 'Vehicle number is required';
  } else if (data.vehicleNumber.length < 3) {
    errors.vehicleNumber = 'Vehicle number must be at least 3 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// File Validation
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  } = options;
  
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return errors;
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return errors;
}

// Tracking Number Validation
export function validateTrackingNumber(trackingNumber) {
  const errors = [];
  
  if (!trackingNumber) {
    errors.push('Tracking number is required');
    return errors;
  }
  
  if (trackingNumber.length < 5) {
    errors.push('Invalid tracking number');
  }
  
  return errors;
}

// Generic Field Validation
export function validateField(value, rules = {}) {
  const errors = [];
  
  if (rules.required && !value) {
    errors.push(`${rules.fieldName || 'This field'} is required`);
    return errors;
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Must be less than ${rules.maxLength} characters`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || 'Invalid format');
  }
  
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value);
    if (customError) errors.push(customError);
  }
  
  return errors;
}