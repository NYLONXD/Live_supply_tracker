const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  vehicleInfo: {
    type: String,
    vehicleNumber: String,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who added
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);