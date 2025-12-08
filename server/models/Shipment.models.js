const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
    index: true,
  },
  eta: {
    type: Number,
    required: true,
  },
  actualETA: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  deliveredAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ status: 1, createdAt: -1 });

// Generate tracking number
shipmentSchema.pre('save', function(next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Virtual for route details
shipmentSchema.virtual('routeDetails', {
  ref: 'Route',
  localField: 'routeId',
  foreignField: '_id',
  justOne: true,
});

shipmentSchema.set('toJSON', { virtuals: true });
shipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shipment', shipmentSchema);