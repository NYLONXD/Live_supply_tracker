const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { cache } = require('../config/redis.config');

// @desc    Track shipment by tracking number (PUBLIC)
// @route   GET /api/track/:trackingNumber
// @access  Public
exports.trackShipment = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;
  
  // Try cache first
  const cacheKey = `track:${trackingNumber}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }
  
  const shipment = await Shipment.findOne({ trackingNumber })
    .populate('assignedDriver', 'displayName phone')
    .select('-notes -driverNotes -createdBy -userId'); // Hide sensitive data
  
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found' });
  }
  
  const trackingData = {
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    from: shipment.from,
    to: shipment.to,
    pickup: shipment.pickup,
    delivery: shipment.delivery,
    currentLocation: shipment.currentLocation,
    currentETA: shipment.currentETA || shipment.estimatedMinutes,
    distance: shipment.distance,
    driver: shipment.assignedDriver ? {
      name: shipment.assignedDriver.displayName,
      phone: shipment.assignedDriver.phone,
    } : null,
    pickedUpAt: shipment.pickedUpAt,
    deliveredAt: shipment.deliveredAt,
    createdAt: shipment.createdAt,
  };
  
  // Cache for 30 seconds (short TTL for live updates)
  await cache.set(cacheKey, trackingData, 30);
  
  res.status(200).json(trackingData);
});