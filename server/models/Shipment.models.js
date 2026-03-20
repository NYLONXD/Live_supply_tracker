// server/models/Shipment.models.js
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
    index: true,
  },

  // Display names
  from: { type: String, required: true },
  to:   { type: String, required: true },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },

  // Coordinates
  pickup: {
    address: String,
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  delivery: {
    address: String,
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // ── Multi-tenancy ──────────────────────────────────────────────────────────
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
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
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },

  // ETA
  estimatedMinutes: Number,
  currentETA:       Number,
  distance:         Number,
  routeGeometry:    { type: [[Number]] },

  // Live tracking
  currentLocation: {
    lat:         Number,
    lng:         Number,
    lastUpdated: Date,
  },

  notes:       String,
  driverNotes: String,
  pickedUpAt:  Date,
  deliveredAt: Date,

}, { timestamps: true });

// Compound indexes for fast tenant-scoped queries
shipmentSchema.index({ organizationId: 1, createdAt: -1 });
shipmentSchema.index({ organizationId: 1, status: 1 });
shipmentSchema.index({ organizationId: 1, assignedDriver: 1 });

// Auto-generate tracking number
shipmentSchema.pre('save', function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

shipmentSchema.methods.updateStatus = function (status) {
  this.status = status;
  if (status === 'picked_up') this.pickedUpAt = new Date();
  if (status === 'delivered') this.deliveredAt = new Date();
  return this.save();
};

shipmentSchema.methods.updateLocation = function (lat, lng) {
  this.currentLocation = { lat, lng, lastUpdated: new Date() };
  return this.save();
};

shipmentSchema.methods.updateETA = function (newETA) {
  this.currentETA = newETA;
  return this.save();
};

module.exports = mongoose.model('Shipment', shipmentSchema);