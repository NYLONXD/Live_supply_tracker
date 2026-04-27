// server/controllers/admin.Controller.js  (notification-aware + cache-correct)
const User         = require('../models/user.models');
const Shipment     = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const notifService = require('../services/notification.service');
const { cache }    = require('../config/redis.config');
const logger       = require('../utils/logger.utils');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    organizationId: req.organizationId,
    role:           { $ne: 'admin' },
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json(users);
});

exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await User.find({
    organizationId: req.organizationId,
    role:           'driver',
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json(drivers);
});

exports.promoteToDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber } = req.body;

  if (!vehicleInfo || !vehicleNumber)
    return res.status(400).json({ message: 'Vehicle info and vehicle number are required' });

  const user = await User.findById(req.params.id);
  if (!user)              return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin')   return res.status(400).json({ message: 'Cannot promote an admin to driver' });
  if (user.role === 'driver')  return res.status(400).json({ message: 'User is already a driver' });

  if (user.organizationId && user.organizationId.toString() !== req.organizationId.toString())
    return res.status(403).json({ message: 'User belongs to a different organization' });

  user.organizationId     = req.organizationId;
  user.role               = 'driver';
  user.vehicleInfo        = vehicleInfo;
  user.vehicleNumber      = vehicleNumber;
  user.promotedToDriverBy = req.user._id;
  user.promotedToDriverAt = new Date();
  await user.save();

  // Notify the newly promoted driver
  notifService.driverPromoted({
    organizationId: req.organizationId,
    userId:         user._id,
  }).catch(() => {});

  logger.info(`${user.email} promoted to driver by ${req.user.email} [org: ${req.organizationId}]`);
  res.json({ message: 'User promoted to driver successfully', user });
});

exports.demoteDriver = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)                  return res.status(404).json({ message: 'User not found' });
  if (user.role !== 'driver') return res.status(400).json({ message: 'User is not a driver' });

  if (user.organizationId && user.organizationId.toString() !== req.organizationId.toString())
    return res.status(403).json({ message: 'Driver belongs to a different organization' });

  user.role               = 'user';
  user.vehicleInfo        = undefined;
  user.vehicleNumber      = undefined;
  user.promotedToDriverBy = undefined;
  user.promotedToDriverAt = undefined;
  await user.save();

  // Notify the demoted user
  notifService.driverDemoted({
    organizationId: req.organizationId,
    userId:         user._id,
  }).catch(() => {});

  logger.info(`${user.email} demoted to user by ${req.user.email}`);
  res.json({ message: 'Driver demoted to user', user });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.organizationId && user.organizationId.toString() !== req.organizationId.toString())
    return res.status(403).json({ message: 'Not authorized to modify this user' });

  user.isActive = !user.isActive;
  await user.save();

  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

exports.updateDriver = asyncHandler(async (req, res) => {
  const { vehicleInfo, vehicleNumber, displayName, phone } = req.body;

  const user = await User.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
    role:           'driver',
  });
  if (!user) return res.status(404).json({ message: 'Driver not found in your organization' });

  if (vehicleInfo)   user.vehicleInfo   = vehicleInfo;
  if (vehicleNumber) user.vehicleNumber = vehicleNumber;
  if (displayName)   user.displayName   = displayName;
  if (phone)         user.phone         = phone;

  await user.save();
  res.json(user);
});

exports.assignDriverToShipment = asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ message: 'driverId is required' });

  const [shipment, driver] = await Promise.all([
    Shipment.findOne({ _id: req.params.id, organizationId: req.organizationId }),
    User.findOne({ _id: driverId, organizationId: req.organizationId, role: 'driver' }),
  ]);

  if (!shipment) return res.status(404).json({ message: 'Shipment not found in your organization' });
  if (!driver)   return res.status(404).json({ message: 'Driver not found in your organization' });

  shipment.assignedDriver = driverId;
  shipment.status         = 'assigned';
  await shipment.save();

  // Invalidate ALL shipment cache entries so the next fetch reflects the
  // newly assigned driver. Without this the list page serves a stale Redis
  // response that still shows "Unassigned".
  await cache.delPattern('shipments:*');

  // Notify the assigned driver
  notifService.shipmentAssigned({
    organizationId: req.organizationId,
    driverId:       driver._id,
    adminId:        req.user._id,
    shipment,
  }).catch(() => {});

  const populated = await shipment.populate('assignedDriver', 'displayName phone vehicleInfo vehicleNumber');

  logger.info(`Shipment ${shipment.trackingNumber} assigned to driver ${driver.email}`);
  res.json(populated);
});