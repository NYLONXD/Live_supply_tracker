const User = require('../models/user.models');
const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger = require('../utils/logger.utils');

// @desc    Get all users (for promoting to driver)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  const query = {};
  if (role) {
    query.role = role;
  }
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json(users);
});

// @desc    Promote user to driver
// @route   POST /api/admin/users/:id/promote-driver
// @access  Private/Admin
exports.promoteToDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber, phone } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Cannot promote admin to driver' });
  }

  if (user.role === 'driver') {
    return res.status(400).json({ message: 'User is already a driver' });
  }

  // Promote to driver
  user.role = 'driver';
  user.vehicleInfo = vehicleInfo;
  user.vehicleNumber = vehicleNumber;
  user.phone = phone || user.phone;
  user.promotedToDriverBy = req.user._id;
  user.promotedToDriverAt = new Date();

  await user.save();

  logger.info(`User ${user.email} promoted to driver by admin ${req.user.email}`);

  res.status(200).json({
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    vehicleInfo: user.vehicleInfo,
    vehicleNumber: user.vehicleNumber,
    phone: user.phone,
  });
});

// @desc    Demote driver to user
// @route   POST /api/admin/users/:id/demote-driver
// @access  Private/Admin
exports.demoteDriver = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role !== 'driver') {
    return res.status(400).json({ message: 'User is not a driver' });
  }

  // Check if driver has active shipments
  const activeShipments = await Shipment.countDocuments({
    assignedDriver: user._id,
    status: { $in: ['assigned', 'picked_up', 'in_transit'] }
  });

  if (activeShipments > 0) {
    return res.status(400).json({ 
      message: `Cannot demote driver with ${activeShipments} active shipment(s)` 
    });
  }

  // Demote to user
  user.role = 'user';

  await user.save();

  logger.info(`Driver ${user.email} demoted to user by admin ${req.user.email}`);

  res.status(200).json({
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    message: 'Driver demoted to user successfully',
  });
});

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await User.find({ role: 'driver' })
    .select('-password')
    .populate('promotedToDriverBy', 'displayName email')
    .sort({ promotedToDriverAt: -1 });

  res.status(200).json(drivers);
});

// @desc    Update driver details
// @route   PUT /api/admin/drivers/:id
// @access  Private/Admin
exports.updateDriver = asyncHandler(async (req, res) => {
  const { phone, vehicleInfo, vehicleNumber } = req.body;

  const driver = await User.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  if (driver.role !== 'driver') {
    return res.status(400).json({ message: 'User is not a driver' });
  }

  if (phone !== undefined) driver.phone = phone;
  if (vehicleInfo !== undefined) driver.vehicleInfo = vehicleInfo;
  if (vehicleNumber !== undefined) driver.vehicleNumber = vehicleNumber;

  await driver.save();

  res.status(200).json(driver);
});

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle
// @access  Private/Admin
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Cannot deactivate admin' });
  }

  user.isActive = !user.isActive;
  await user.save();

  logger.info(`User ${user.email} ${user.isActive ? 'activated' : 'deactivated'}`);

  res.status(200).json({
    _id: user._id,
    email: user.email,
    isActive: user.isActive,
  });
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

  const driver = await User.findOne({ _id: driverId, role: 'driver', isActive: true });
  if (!driver) {
    return res.status(404).json({ message: 'Active driver not found' });
  }

  shipment.assignedDriver = driverId;
  shipment.status = 'assigned';
  await shipment.save();

  await shipment.populate('assignedDriver', 'displayName email phone vehicleInfo');

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