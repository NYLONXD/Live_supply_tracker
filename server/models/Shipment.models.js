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

  // Coordinates — single source of truth
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

  // ETA — single source of truth (minutes)
  estimatedMinutes: Number,  // AI-predicted total ETA at creation
  currentETA: Number,        // Recalculated as driver moves
  distance: Number,          // Real road distance in km (from Mapbox)

  // Route polyline from Mapbox — [lng, lat] array
  routeGeometry: {
    type: [[Number]],
  },

  // Live tracking
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

}, { timestamps: true });

// Indexes
shipmentSchema.index({ createdBy: 1, createdAt: -1 });
shipmentSchema.index({ assignedDriver: 1, status: 1 });

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