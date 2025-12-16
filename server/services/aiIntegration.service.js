const axios = require('axios');
const logger = require('../utils/logger.utils');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIIntegrationService {
  
  async calculateETA(pickupCoords, deliveryCoords, options = {}) {
    try {
      const {
        vehicleType = 'Car',
        weather = 'Clear',
        route = 'A'
      } = options;
      
      // Calculate distance using Haversine
      const distance = this.calculateDistance(pickupCoords, deliveryCoords);
      const baseSpeed = this.getBaseSpeed(vehicleType);
      const trafficFactor = options.trafficFactor || 1.0;
      
      // Get current time info
      const now = new Date();
      const timeOfDay = now.getHours();
      const dayOfWeek = now.getDay();
      
      logger.info(`Calling AI service for ETA prediction...`);
      
      // Call AI service
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
        distance: distance,
        base_speed: baseSpeed,
        traffic_factor: trafficFactor,
        vehicle: vehicleType,
        weather: weather,
        route: route,
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logger.info(`✅ AI ETA: ${response.data.estimated_eta_minutes} min (${response.data.confidence} confidence)`);
      
      return {
        estimatedMinutes: response.data.estimated_eta_minutes,
        estimatedHours: response.data.estimated_eta_hours,
        distance: distance,
        confidence: response.data.confidence,
        model: response.data.model_used,
        range: response.data.eta_range,
        factors: response.data.factors
      };
      
    } catch (error) {
      logger.error(`❌ AI ETA calculation failed: ${error.message}`);
      
      // Fallback to simple calculation
      const distance = this.calculateDistance(pickupCoords, deliveryCoords);
      const estimatedMinutes = (distance / 40) * 60;
      
      return {
        estimatedMinutes: Math.ceil(estimatedMinutes),
        estimatedHours: estimatedMinutes / 60,
        distance: distance,
        confidence: 'low',
        model: 'fallback'
      };
    }
  }
  
  getBaseSpeed(vehicleType) {
    const speeds = {
      'Car': 60,
      'Bike': 40,
      'Truck': 50,
      'Van': 55
    };
    return speeds[vehicleType] || 60;
  }
  
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * 
      Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new AIIntegrationService();