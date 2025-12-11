const Shipment = require('../models/Shipment.models');
const aiService = require('../services/aiIntegration.service');
const asyncHandler = require('../utils/asyncHandler.utils');

// @desc    Get my assigned shipments
// @route   GET /api/driver/shipments
// @access  Private (Driver only)
exports.getMyShipments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const query = {
    assignedDriver: req.user._id,
  };
  
  if (status) {
    query.status = status;
  }
  
  const shipments = await Shipment.find(query)
    .populate('createdBy', 'displayName email phone')
    .sort({ createdAt: -1 });
  
  res.status(200).json(shipments);
});

// @desc    Update shipment status
// @route   PUT /api/driver/shipments/:id/status
// @access  Private (Driver only)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const shipment = await Shipment.findOne({
    _id: req.params.id,
    assignedDriver: req.user._id,
  });
  
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found or not assigned to you' });
  }
  
  await shipment.updateStatus(status);
  
  // Emit socket event
  const io = req.app.get('io');
  io.emit('status_updated', {
    shipmentId: shipment._id,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    timestamp: new Date(),
  });
  
  res.status(200).json(shipment);
});

// @desc    Update location
// @route   POST /api/driver/location
// @access  Private (Driver only)
exports.updateLocation = asyncHandler(async (req, res) => {
  const { shipmentId, lat, lng } = req.body;
  
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriver: req.user._id,
  });
  
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found or not assigned to you' });
  }
  
  // Update location
  await shipment.updateLocation(lat, lng);
  
  // Recalculate ETA with AI
  const newETA = await aiService.updateETA(
    { lat, lng },
    { lat: shipment.delivery.lat, lng: shipment.delivery.lng }
  );
  
  await shipment.updateETA(newETA.estimatedMinutes);
  
  // Emit socket event
  const io = req.app.get('io');
  io.emit('location_updated', {
    shipmentId: shipment._id,
    trackingNumber: shipment.trackingNumber,
    location: { lat, lng },
    timestamp: new Date(),
  });
  
  io.emit('eta_updated', {
    shipmentId: shipment._id,
    trackingNumber: shipment.trackingNumber,
    newETA: newETA.estimatedMinutes,
    timestamp: new Date(),
  });
  
  res.status(200).json({
    success: true,
    currentLocation: shipment.currentLocation,
    currentETA: shipment.currentETA,
  });
});

// @desc    Add driver notes
// @route   PUT /api/driver/shipments/:id/notes
// @access  Private (Driver only)
exports.addNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const shipment = await Shipment.findOne({
    _id: req.params.id,
    assignedDriver: req.user._id,
  });
  
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found' });
  }
  
  shipment.driverNotes = notes;
  await shipment.save();
  
  res.status(200).json(shipment);
});