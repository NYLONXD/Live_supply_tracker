// server/services/shipment.service.js
const Shipment = require('../models/Shipment.models');
const aiService = require('./aiIntegration.service');
const { cache } = require('../config/redis.config');
const logger = require('../utils/logger.utils');

class ShipmentService {

  async createShipment(data, userId) {
    const { from, to, fromLat, fromLng, toLat, toLng, notes, vehicleType, weather } = data;

    // Get real road distance + AI-adjusted ETA
    const etaData = await aiService.calculateETA(
      { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
      { lat: parseFloat(toLat),   lng: parseFloat(toLng)   },
      { vehicleType: vehicleType || 'Car', weather: weather || 'Clear' }
    );

    const shipment = await Shipment.create({
      from,
      to,
      pickup:   { address: from, lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
      delivery: { address: to,   lat: parseFloat(toLat),   lng: parseFloat(toLng)   },
      createdBy: userId,
      estimatedMinutes: etaData.estimatedMinutes,
      currentETA:       etaData.estimatedMinutes,
      distance:         etaData.distance,
      routeGeometry:    etaData.routeGeometry || [],
      notes,
    });

    await cache.delPattern('shipments:*');
    logger.info(`Shipment created: ${shipment.trackingNumber}`);
    return shipment;
  }

  async getShipments(userId, role, filters = {}) {
    const query = {};

    if (role === 'user') {
      query.createdBy = userId;
    } else if (role === 'driver') {
      query.assignedDriver = userId;
    }
    // admin sees all

    if (filters.status) query.status = filters.status;

    const cacheKey = `shipments:${role}:${userId}:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const shipments = await Shipment.find(query)
      .populate('assignedDriver', 'displayName email phone')
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);

    await cache.set(cacheKey, shipments, 300);
    return shipments;
  }

  async getShipmentById(id, userId, role) {
    const shipment = await Shipment.findById(id)
      .populate('assignedDriver', 'displayName email phone')
      .populate('createdBy', 'displayName email');

    if (!shipment) throw new Error('Shipment not found');

    if (role === 'user') {
      const isOwner = shipment.createdBy?._id.toString() === userId.toString();
      if (!isOwner) throw new Error('Not authorized');
    }

    if (role === 'driver' && shipment.assignedDriver?._id.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }

    return shipment;
  }

  async updateShipment(id, data, userId, role) {
    const shipment = await this.getShipmentById(id, userId, role);

    const isOwner = shipment.createdBy?._id.toString() === userId.toString();
    if (role !== 'admin' && !isOwner) throw new Error('Not authorized to update');

    Object.assign(shipment, data);
    await shipment.save();

    await cache.delPattern('shipments:*');
    logger.info(`Shipment ${shipment.trackingNumber} updated`);
    return shipment;
  }

  async deleteShipment(id, userId, role) {
    const shipment = await this.getShipmentById(id, userId, role);

    const isOwner = shipment.createdBy?._id.toString() === userId.toString();
    if (role !== 'admin' && !isOwner) throw new Error('Not authorized to delete');

    await shipment.deleteOne();
    await cache.delPattern('shipments:*');
    logger.info(`Shipment ${shipment.trackingNumber} deleted`);
  }
}

module.exports = new ShipmentService();