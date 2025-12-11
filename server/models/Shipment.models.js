const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
    index: true,
  },
  
  // Locations
  pickup: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  
  delivery: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  
  // Users
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // AI-generated data
  estimatedMinutes: {
    type: Number,
    required: true,
  },
  
  currentETA: {
    type: Number, // Updates as driver moves
  },
  
  distance: {
    type: Number, // km
    required: true,
  },
  
  route: {
    type: [[Number]], // [lng, lat] array for map polyline
  },
  
  // Live tracking
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date,
  },
  
  // Notes
  notes: {
    type: String,
    trim: true,
  },
  
  driverNotes: {
    type: String,
    trim: true,
  },
  
  // Timestamps
  pickedUpAt: Date,
  deliveredAt: Date,
  
}, {
  timestamps: true,
});

// Indexes
shipmentSchema.index({ createdBy: 1, createdAt: -1 });
shipmentSchema.index({ assignedDriver: 1, status: 1 });
shipmentSchema.index({ status: 1, createdAt: -1 });

// Generate tracking number before save
shipmentSchema.pre('save', function(next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Methods
shipmentSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'picked_up') this.pickedUpAt = new Date();
  if (status === 'delivered') this.deliveredAt = new Date();
  return this.save();
};

shipmentSchema.methods.updateLocation = function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    lastUpdated: new Date(),
  };
  return this.save();
};

shipmentSchema.methods.updateETA = function(newETA) {
  this.currentETA = newETA;
  return this.save();
};

module.exports = mongoose.model('Shipment', shipmentSchema);