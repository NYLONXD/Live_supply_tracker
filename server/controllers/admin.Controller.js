const Driver = require('../models/Driver.models');
const User = require('../models/user.models');
const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger = require('../utils/logger.utils');

// @desc    Add a driver
// @route   POST /api/admin/drivers
// @access  Private/Admin
exports.addDriver = asyncHandler(async (req, res) => {
  const { email, phone, vehicleInfo } = req.body;

  if (!email) { 
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if already exists
  const existing = await Driver.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: 'Driver already exists' });
  }

  const driver = await Driver.create({
    email: email.toLowerCase(),
    phone,
    vehicleInfo,
    addedBy: req.user._id,
  });

  // Update user role if they already have account
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.role = 'driver';
    await user.save();
    driver.userId = user._id;
    await driver.save();
  }

  logger.info(`Driver added: ${email} by admin ${req.user.email}`);
  res.status(201).json(driver);
});

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find()
    .populate('userId', 'displayName email photoURL phone')
    .populate('addedBy', 'displayName email')
    .sort({ createdAt: -1 });

  res.status(200).json(drivers);
});

// @desc    Remove a driver
// @route   DELETE /api/admin/drivers/:id
// @access  Private/Admin
exports.removeDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  // Check if driver has active shipments
  const activeShipments = await Shipment.countDocuments({
    assignedDriver: driver.userId,
    status: { $in: ['assigned', 'picked_up', 'in_transit'] }
  });

  if (activeShipments > 0) {
    return res.status(400).json({ 
      message: `Cannot remove driver with ${activeShipments} active shipment(s)` 
    });
  }

  await driver.deleteOne();

  // Update user role back to 'user' if they have account
  if (driver.userId) {
    const user = await User.findById(driver.userId);
    if (user) {
      user.role = 'user';
      await user.save();
    }
  }

  logger.info(`Driver removed: ${driver.email}`);
  res.status(200).json({ message: 'Driver removed successfully' });
});

// @desc    Toggle driver active status
// @route   PATCH /api/admin/drivers/:id/toggle
// @access  Private/Admin
exports.toggleDriverStatus = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  driver.isActive = !driver.isActive;
  await driver.save();

  // Update user account status
  if (driver.userId) {
    const user = await User.findById(driver.userId);
    if (user) {
      user.isActive = driver.isActive;
      await user.save();
    }
  }

  logger.info(`Driver ${driver.isActive ? 'activated' : 'deactivated'}: ${driver.email}`);
  res.status(200).json(driver);
});

// @desc    Update driver details
// @route   PUT /api/admin/drivers/:id
// @access  Private/Admin
exports.updateDriver = asyncHandler(async (req, res) => {
  const { phone, vehicleInfo } = req.body;

  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  if (phone !== undefined) driver.phone = phone;
  if (vehicleInfo !== undefined) driver.vehicleInfo = vehicleInfo;

  await driver.save();

  res.status(200).json(driver);
});

// @desc    Assign driver to shipment
// @route   POST /api/admin/shipments/:id/assign
// @access  Private/Admin
exports.assignDriverToShipment = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  if (!driverId) {
    return res.status(400).json({ message: 'Driver ID is required' });
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found' });
  }

  const driver = await Driver.findOne({ userId: driverId, isActive: true });
  if (!driver) {
    return res.status(404).json({ message: 'Active driver not found' });
  }

  shipment.assignedDriver = driverId;
  shipment.status = 'assigned';
  await shipment.save();

  await shipment.populate('assignedDriver', 'displayName email phone');

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('shipment_assigned', {
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      driverId: driverId,
      driverName: shipment.assignedDriver.displayName,
    });
  }

  logger.info(`Shipment ${shipment.trackingNumber} assigned to driver ${driver.email}`);
  res.status(200).json(shipment);
});