// server/services/aiIntegration.service.js - COMPLETE FIXED VERSION
const axios = require('axios');
const logger = require('../utils/logger.utils');

// AI service runs on port 8000
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
      
      logger.info(`🤖 Calling AI service at ${AI_SERVICE_URL}/predict`);
      logger.info(`📊 Request params: distance=${distance.toFixed(2)}km, vehicle=${vehicleType}, weather=${weather}`);
      
      // ✅ Call /predict endpoint (FastAPI doesn't use /api prefix)
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
      
      logger.info(`✅ AI Response: ETA=${response.data.estimated_eta_minutes}min, confidence=${response.data.confidence}, model=${response.data.model_used}`);
      
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
      
      // Enhanced error logging
      if (error.response) {
        logger.error(`Response Status: ${error.response.status}`);
        logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        logger.error('❌ No response from AI service');
        logger.error(`   - Is the AI service running on port 8000?`);
        logger.error(`   - Check: curl http://localhost:8000/health`);
      } else {
        logger.error(`Request Error: ${error.message}`);
      }
      
      // Fallback to simple calculation
      const distance = this.calculateDistance(pickupCoords, deliveryCoords);
      const baseSpeed = this.getBaseSpeed(options.vehicleType || 'Car');
      const estimatedMinutes = (distance / baseSpeed) * 60 * 1.2; // Add 20% buffer
      
      logger.info(`📊 Using fallback ETA calculation: ${Math.ceil(estimatedMinutes)} min`);
      
      return {
        estimatedMinutes: Math.ceil(estimatedMinutes),
        estimatedHours: estimatedMinutes / 60,
        distance: distance,
        confidence: 'low',
        model: 'fallback',
        fallback: true,
        error: 'AI service unavailable'
      };
    }
  }
  
  async updateETA(currentLocation, destinationLocation) {
    try {
      // Calculate remaining distance
      const distance = this.calculateDistance(currentLocation, destinationLocation);
      const baseSpeed = 50; // Default average speed
      
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
        distance: distance,
        base_speed: baseSpeed,
        traffic_factor: 1.0,
        vehicle: 'Car',
        weather: 'Clear',
        route: 'A',
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay()
      }, { timeout: 5000 });
      
      return {
        estimatedMinutes: response.data.estimated_eta_minutes,
        distance: distance
      };
      
    } catch (error) {
      // Fallback calculation
      const distance = this.calculateDistance(currentLocation, destinationLocation);
      const estimatedMinutes = (distance / 50) * 60 * 1.2;
      
      return {
        estimatedMinutes: Math.ceil(estimatedMinutes),
        distance: distance
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
  
  // Health check
  async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      logger.info(`✅ AI Service Health: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logger.error(`❌ AI service health check failed: ${error.message}`);
      return null;
    }
  }
}

module.exports = new AIIntegrationService();