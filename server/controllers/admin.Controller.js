// server/controllers/admin.Controller.js
//
// Every query in this file is scoped to req.organizationId.
// This is the key line in every function:
//   Model.find({ organizationId: req.organizationId, ... })
// That single filter ensures Shop A's admin can NEVER see Shop B's data.

const User     = require('../models/user.models');
const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger   = require('../utils/logger.utils');

// ─── Get all users in this org ────────────────────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ organizationId: req.organizationId })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json(users);
});

// ─── Get all drivers in this org ──────────────────────────────────────────────
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await User.find({
    organizationId: req.organizationId,
    role: 'driver',
  })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json(drivers);
});

// ─── Promote user to driver ───────────────────────────────────────────────────
exports.promoteToDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber } = req.body;

  // Ensure the user belongs to THIS org
  const user = await User.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
  });

  if (!user)
    return res.status(404).json({ message: 'User not found in your organization' });

  if (user.role === 'driver')
    return res.status(400).json({ message: 'User is already a driver' });

  user.role               = 'driver';
  user.vehicleInfo        = vehicleInfo;
  user.vehicleNumber      = vehicleNumber;
  user.promotedToDriverBy = req.user._id;
  user.promotedToDriverAt = new Date();
  await user.save();

  logger.info(`User ${user.email} promoted to driver by ${req.user.email} [org: ${req.organizationId}]`);
  res.json({ message: 'User promoted to driver', user });
});

// ─── Demote driver back to user ───────────────────────────────────────────────
exports.demoteDriver = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
  });

  if (!user)
    return res.status(404).json({ message: 'User not found in your organization' });

  if (user.role !== 'driver')
    return res.status(400).json({ message: 'User is not a driver' });

  user.role          = 'user';
  user.vehicleInfo   = undefined;
  user.vehicleNumber = undefined;
  await user.save();

  res.json({ message: 'Driver demoted to user', user });
});

// ─── Toggle user active/inactive ─────────────────────────────────────────────
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
  });

  if (!user)
    return res.status(404).json({ message: 'User not found in your organization' });

  user.isActive = !user.isActive;
  await user.save();

  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

// ─── Update driver info ───────────────────────────────────────────────────────
exports.updateDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber, displayName, phone } = req.body;

  const user = await User.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
    role:           'driver',
  });

  if (!user)
    return res.status(404).json({ message: 'Driver not found in your organization' });

  if (vehicleInfo)   user.vehicleInfo   = vehicleInfo;
  if (vehicleNumber) user.vehicleNumber = vehicleNumber;
  if (displayName)   user.displayName   = displayName;
  if (phone)         user.phone         = phone;

  await user.save();
  res.json(user);
});

// ─── Assign driver to shipment ────────────────────────────────────────────────
exports.assignDriverToShipment = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  // Both the shipment and the driver must belong to this org
  const [shipment, driver] = await Promise.all([
    Shipment.findOne({ _id: req.params.id, organizationId: req.organizationId }),
    User.findOne({ _id: driverId, organizationId: req.organizationId, role: 'driver' }),
  ]);

  if (!shipment)
    return res.status(404).json({ message: 'Shipment not found in your organization' });

  if (!driver)
    return res.status(404).json({ message: 'Driver not found in your organization' });

  shipment.assignedDriver = driverId;
  shipment.status         = 'assigned';
  await shipment.save();

  const populated = await shipment.populate('assignedDriver', 'displayName phone vehicleInfo vehicleNumber');
  res.json(populated);
});