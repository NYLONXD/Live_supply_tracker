const Shipment = require('../models/Shipment.models');
const aiService = require('./aiIntegration.service');
const { cache } = require('../config/redis.config');
const logger = require('../utils/logger.utils');

class ShipmentService {
  
  // Create new shipment
  async createShipment(data, userId) {
    const { from, to, fromLat, fromLng, toLat, toLng, notes, vehicleType, weather } = data;
    
    // Calculate ETA with AI
    const etaData = await aiService.calculateETA(
      { lat: fromLat, lng: fromLng },
      { lat: toLat, lng: toLng },
      vehicleType,
      weather
    );
    
    // Create shipment
    const shipment = await Shipment.create({
      from,
      to,
      fromLat,
      fromLng,
      toLat,
      toLng,
      pickup: {
        address: from,
        lat: fromLat,
        lng: fromLng,
      },
      delivery: {
        address: to,
        lat: toLat,
        lng: toLng,
      },
      userId: userId,
      createdBy: userId,
      estimatedMinutes: etaData.estimatedMinutes,
      currentETA: etaData.estimatedMinutes,
      eta: etaData.estimatedMinutes / 60, // hours for backward compatibility
      distance: etaData.distance,
      route: etaData.route,
      notes,
    });
    
    // Clear cache
    await cache.delPattern('shipments:*');
    
    logger.info(`Shipment created: ${shipment.trackingNumber} by user ${userId}`);
    
    return shipment;
  }
  
  // Get all shipments with filters
  async getShipments(userId, role, filters = {}) {
    const query = {};
    
    // Role-based filtering
    if (role === 'user') {
      query.$or = [{ userId: userId }, { createdBy: userId }];
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
    if (role === 'user') {
      const isOwner = shipment.createdBy?._id.toString() === userId.toString() || 
                      shipment.userId?.toString() === userId.toString();
      if (!isOwner) {
        throw new Error('Not authorized');
      }
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
    const isOwner = shipment.createdBy?._id.toString() === userId.toString() || 
                    shipment.userId?.toString() === userId.toString();
    
    if (role !== 'admin' && !isOwner) {
      throw new Error('Not authorized to update');
    }
    
    Object.assign(shipment, data);
    await shipment.save();
    
    await cache.delPattern('shipments:*');
    
    logger.info(`Shipment ${shipment.trackingNumber} updated`);
    return shipment;
  }
  
  // Delete shipment
  async deleteShipment(id, userId, role) {
    const shipment = await this.getShipmentById(id, userId, role);
    
    // Only admin and original creator can delete
    const isOwner = shipment.createdBy?._id.toString() === userId.toString() || 
                    shipment.userId?.toString() === userId.toString();
    
    if (role !== 'admin' && !isOwner) {
      throw new Error('Not authorized to delete');
    }
    
    await shipment.deleteOne();
    await cache.delPattern('shipments:*');
    
    logger.info(`Shipment ${shipment.trackingNumber} deleted`);
    return { message: 'Shipment deleted' };
  }
}

module.exports = new ShipmentService();