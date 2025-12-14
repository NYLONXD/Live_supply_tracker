const shipmentService = require('../services/shipment.service');
const asyncHandler = require('../utils/asyncHandle.utils');

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
exports.getShipments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filters = status ? { status } : {};
  
  const shipments = await shipmentService.getShipments(
    req.user._id,
    req.user.role,
    filters
  );
  
  res.status(200).json(shipments);
});

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  
  res.status(200).json(shipment);
});

// @desc    Create shipment
// @route   POST /api/shipments
// @access  Private (User/Admin)
exports.createShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.createShipment(
    req.body,
    req.user._id
  );
  
  // Emit socket event if driver assigned
  if (shipment.assignedDriver) {
    const io = req.app.get('io');
    io.emit('shipment_assigned', {
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      driverId: shipment.assignedDriver._id,
    });
  }
  
  res.status(201).json(shipment);
});

// @desc    Update shipment
// @route   PUT /api/shipments/:id
// @access  Private (Creator/Admin)
exports.updateShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.updateShipment(
    req.params.id,
    req.body,
    req.user._id,
    req.user.role
  );
  
  res.status(200).json(shipment);
});

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Private (Creator/Admin)
exports.deleteShipment = asyncHandler(async (req, res) => {
  await shipmentService.deleteShipment(
    req.params.id,
    req.user._id,
    req.user.role
  );
  
  res.status(200).json({ message: 'Shipment deleted' });
});

// @desc    Assign driver to shipment
// @route   POST /api/shipments/:id/assign
// @access  Private (Admin only)
exports.assignDriver = asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  
  const shipment = await shipmentService.assignDriver(
    req.params.id,
    driverId,
    req.user._id
  );
  
  // Emit socket event
  const io = req.app.get('io');
  io.emit('shipment_assigned', {
    shipmentId: shipment._id,
    trackingNumber: shipment.trackingNumber,
    driverId:
      shipment.assignedDriver && shipment.assignedDriver._id
        ? shipment.assignedDriver._id
        : shipment.assignedDriver,
  });
  
  res.status(200).json(shipment);
});