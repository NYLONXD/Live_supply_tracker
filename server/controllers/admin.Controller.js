// server/controllers/admin.Controller.js
const User     = require('../models/user.models');
const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger   = require('../utils/logger.utils');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    organizationId: req.organizationId,
    role: { $ne: 'admin' },
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json(users);
});
// ─── Get all drivers in this org ──────────────────────────────────────────────
// Strictly org-scoped — drivers are always linked to an org after promotion.
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await User.find({
    organizationId: req.organizationId,
    role: 'driver',
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json(drivers);
});

// ─── Promote user → driver ────────────────────────────────────────────────────
exports.promoteToDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber } = req.body;

  if (!vehicleInfo || !vehicleNumber) {
    return res.status(400).json({ message: 'Vehicle info and vehicle number are required' });
  }

  // Find by _id only — user may not have an org yet
  const user = await User.findById(req.params.id);

  if (!user)
    return res.status(404).json({ message: 'User not found' });

  if (user.role === 'admin')
    return res.status(400).json({ message: 'Cannot promote an admin to driver' });

  if (user.role === 'driver')
    return res.status(400).json({ message: 'User is already a driver' });

  // If the user already belongs to a DIFFERENT org, block it
  if (
    user.organizationId &&
    user.organizationId.toString() !== req.organizationId.toString()
  ) {
    return res.status(403).json({ message: 'User belongs to a different organization' });
  }

  // Assign org + promote
  user.organizationId     = req.organizationId;   // ← key: links user to this org
  user.role               = 'driver';
  user.vehicleInfo        = vehicleInfo;
  user.vehicleNumber      = vehicleNumber;
  user.promotedToDriverBy = req.user._id;
  user.promotedToDriverAt = new Date();
  await user.save();

  logger.info(`${user.email} promoted to driver by ${req.user.email} [org: ${req.organizationId}]`);
  res.json({ message: 'User promoted to driver successfully', user });
});

// ─── Demote driver → user ─────────────────────────────────────────────────────
// Find by _id — the driver is guaranteed to have this org (set during promotion).
// We still verify org ownership before acting.
exports.demoteDriver = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user)
    return res.status(404).json({ message: 'User not found' });

  if (user.role !== 'driver')
    return res.status(400).json({ message: 'User is not a driver' });

  // Safety check: make sure this driver actually belongs to this admin's org
  if (
    user.organizationId &&
    user.organizationId.toString() !== req.organizationId.toString()
  ) {
    return res.status(403).json({ message: 'Driver belongs to a different organization' });
  }

  user.role               = 'user';
  user.vehicleInfo        = undefined;
  user.vehicleNumber      = undefined;
  user.promotedToDriverBy = undefined;
  user.promotedToDriverAt = undefined;
  // Keep organizationId so they remain a known user in this org
  await user.save();

  logger.info(`${user.email} demoted to user by ${req.user.email}`);
  res.json({ message: 'Driver demoted to user', user });
});

// ─── Toggle user active / inactive ───────────────────────────────────────────
// Same pattern: find by _id, verify org if present.
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user)
    return res.status(404).json({ message: 'User not found' });

  // Users without an org can be toggled by any admin (they're "global" accounts)
  // Users WITH an org can only be toggled by their own org's admin
  if (
    user.organizationId &&
    user.organizationId.toString() !== req.organizationId.toString()
  ) {
    return res.status(403).json({ message: 'Not authorized to modify this user' });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

// ─── Update driver info ───────────────────────────────────────────────────────
// Strictly org-scoped — only update drivers that belong to this org.
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
// Both the shipment AND the driver must belong to this org.
exports.assignDriverToShipment = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  if (!driverId)
    return res.status(400).json({ message: 'driverId is required' });

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

  logger.info(`Shipment ${shipment.trackingNumber} assigned to driver ${driver.email}`);
  res.json(populated);
});