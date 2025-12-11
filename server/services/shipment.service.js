const Shipment = require('../models/Shipment.models');
const aiService = require('./aiIntegration.service');
const { cache } = require('../config/redis.config');
const logger = require('../utils/logger.utils');

class ShipmentService {
  
  // Create new shipment
  async createShipment(data, userId) {
    const { pickupAddress, deliveryAddress, driverId, notes } = data;
    
    // Validate addresses with AI
    const [pickup, delivery] = await Promise.all([
      aiService.validateAddress(pickupAddress),
      aiService.validateAddress(deliveryAddress),
    ]);
    
    if (!pickup.valid || !delivery.valid) {
      throw new Error('Invalid pickup or delivery address');
    }
    
    // Calculate ETA with AI
    const etaData = await aiService.calculateETA(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: delivery.lat, lng: delivery.lng }
    );
    
    // Create shipment
    const shipment = await Shipment.create({
      pickup: {
        address: pickup.formatted,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      delivery: {
        address: delivery.formatted,
        lat: delivery.lat,
        lng: delivery.lng,
      },
      createdBy: userId,
      assignedDriver: driverId || null,
      estimatedMinutes: etaData.estimatedMinutes,
      currentETA: etaData.estimatedMinutes,
      distance: etaData.distance,
      route: etaData.route,
      notes,
    });
    
    // Populate driver info
    await shipment.populate('assignedDriver', 'displayName email phone');
    
    // Clear cache
    await cache.delPattern('shipments:*');
    
    logger.info(`Shipment created: ${shipment.trackingNumber}`);
    
    return shipment;
  }
  
  // Get all shipments with filters
  async getShipments(userId, role, filters = {}) {
    const query = {};
    
    // Role-based filtering
    if (role === 'user') {
      query.createdBy = userId;
    } else if (role === 'driver') {
      query.assignedDriver = userId;
    }
    // Admin sees all
    
    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }
    
    const cacheKey = `shipments:${role}:${userId}:${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    const shipments = await Shipment.find(query)
      .populate('assignedDriver', 'displayName email phone')
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    await cache.set(cacheKey, shipments, 300); // 5 min
    return shipments;
  }
  
  // Get single shipment
  async getShipmentById(id, userId, role) {
    const shipment = await Shipment.findById(id)
      .populate('assignedDriver', 'displayName email phone')
      .populate('createdBy', 'displayName email');
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    // Check permissions
    if (role === 'user' && shipment.createdBy._id.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    
    if (role === 'driver' && shipment.assignedDriver?._id.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    
    return shipment;
  }
  
  // Update shipment
  async updateShipment(id, data, userId, role) {
    const shipment = await this.getShipmentById(id, userId, role);
    
    // Only admin and original creator can update
    if (role !== 'admin' && shipment.createdBy._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to update');
    }
    
    Object.assign(shipment, data);
    await shipment.save();
    
    await cache.delPattern('shipments:*');
    
    return shipment;
  }
  
  // Delete shipment
  async deleteShipment(id, userId, role) {
    const shipment = await this.getShipmentById(id, userId, role);
    
    // Only admin and original creator can delete
    if (role !== 'admin' && shipment.createdBy._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete');
    }
    
    await shipment.deleteOne();
    await cache.delPattern('shipments:*');
    
    return { message: 'Shipment deleted' };
  }
  
  // Assign driver
  async assignDriver(shipmentId, driverId, userId) {
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    shipment.assignedDriver = driverId;
    await shipment.save();
    
    await cache.delPattern('shipments:*');
    
    return shipment;
  }
}

module.exports = new ShipmentService();