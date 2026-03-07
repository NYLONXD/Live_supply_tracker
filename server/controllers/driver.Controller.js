// server/controllers/driver.Controller.js
const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger = require('../utils/logger.utils');
const aiService = require('../services/aiIntegration.service');

// GET /api/driver/shipments
exports.getMyShipments = asyncHandler(async (req, res) => {
  const query = { assignedDriver: req.user._id };
  if (req.query.status) query.status = req.query.status;

  const shipments = await Shipment.find(query)
    .populate('createdBy', 'displayName email phone')
    .sort({ createdAt: -1 });

  res.status(200).json(shipments);
});

// PUT /api/driver/shipments/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const shipment = await Shipment.findOne({ _id: req.params.id, assignedDriver: req.user._id });
  if (!shipment) return res.status(404).json({ message: 'Shipment not found or not assigned to you' });

  await shipment.updateStatus(status);

  const io = req.app.get('io');
  if (io) {
    io.to(`shipment_${shipment.trackingNumber}`).emit('status_updated', {
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      timestamp: new Date(),
    });
  }

  logger.info(`Shipment ${shipment.trackingNumber} → ${status} by driver ${req.user.email}`);
  res.status(200).json(shipment);
});

// POST /api/driver/location  — single authoritative path for location updates
exports.updateLocation = asyncHandler(async (req, res) => {
  const { shipmentId, lat, lng } = req.body;

  if (!shipmentId || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'shipmentId, lat, and lng are required' });
  }

  const shipment = await Shipment.findOne({ _id: shipmentId, assignedDriver: req.user._id });
  if (!shipment) return res.status(404).json({ message: 'Shipment not found or not assigned to you' });

  // Save to DB
  await shipment.updateLocation(lat, lng);

  // Recalculate remaining ETA using Mapbox road distance
  const newETA = await aiService.updateETA(
    { lat, lng },
    { lat: shipment.delivery.lat, lng: shipment.delivery.lng }
  );

  await shipment.updateETA(newETA.estimatedMinutes);

  // Emit to all users tracking this shipment
  const io = req.app.get('io');
  if (io) {
    io.to(`shipment_${shipment.trackingNumber}`).emit('location_updated', {
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      location: { lat, lng },
      timestamp: new Date(),
    });

    io.to(`shipment_${shipment.trackingNumber}`).emit('eta_updated', {
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      newETA: newETA.estimatedMinutes,
      timestamp: new Date(),
    });
  }

  logger.info(`Location updated for ${shipment.trackingNumber}`);

  res.status(200).json({
    success: true,
    currentLocation: shipment.currentLocation,
    currentETA: shipment.currentETA,
    remainingDistance: newETA.distance,
  });
});

// PUT /api/driver/shipments/:id/notes
exports.addNotes = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ _id: req.params.id, assignedDriver: req.user._id });
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

  shipment.driverNotes = req.body.notes;
  await shipment.save();

  res.status(200).json(shipment);
});