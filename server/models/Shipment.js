const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  from: String,
  to: String,
  eta: Number,
  fromLat: Number,
  fromLng: Number,
  toLat: Number,
  toLng: Number,
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: false } // Optional for demo/anonymous use
});

module.exports = mongoose.model('Shipment', shipmentSchema);
