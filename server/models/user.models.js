const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't return password by default
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
  role: {
    type: String,
    enum: ['user', 'driver', 'admin'],
    default: 'user',
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