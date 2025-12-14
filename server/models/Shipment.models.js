const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
    index: true,
  },
  
  // Locations (UPDATED - more detailed)
  from: String, // Keep for backward compatibility
  to: String,
  
  pickup: {
    address: String,
    lat: Number,
    lng: Number,
  },
  
  delivery: {
    address: String,
    lat: Number,
    lng: Number,
  },
  
  // Legacy fields (your current data)
  fromLat: Number,
  fromLng: Number,
  toLat: Number,
  lat: Number, // Keep for old records
  lng: Number,
  
  // Users
  userId: { // OLD - for backward compatibility
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  createdBy: { // NEW
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // ETA (you have this)
  eta: Number, // Keep for old records
  
  // AI-generated data (NEW)
  estimatedMinutes: Number,
  currentETA: Number, // Updates as driver moves
  distance: Number, // km
  
  route: {
    type: [[Number]], // [lng, lat] array for map polyline
  },
  
  // Live tracking (NEW)
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date,
  },
  
  // Notes
  notes: String,
  driverNotes: String,
  
  // Timestamps
  pickedUpAt: Date,
  deliveredAt: Date,
  
}, {
  timestamps: true,
});

// Indexes
shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ createdBy: 1, createdAt: -1 });
shipmentSchema.index({ assignedDriver: 1, status: 1 });

// Auto-generate tracking number
shipmentSchema.pre('save', function(next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  
  // Auto-populate createdBy from userId for old records
  if (!this.createdBy && this.userId) {
    this.createdBy = this.userId;
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