const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  displayName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
  },
  photoURL: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'driver', 'admin'],
    default: 'user',
  },
  
  // Driver-specific fields (only used when role = 'driver')
  vehicleInfo: {
    type: String,
    trim: true,
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  promotedToDriverBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who promoted this user to driver
  },
  promotedToDriverAt: {
    type: Date,
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
  },
}, {
  timestamps: true,
});

// Methods
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.isDriver = function() {
  return this.role === 'driver';
};

userSchema.methods.isUser = function() {
  return this.role === 'user';
};

module.exports = mongoose.model('User', userSchema);