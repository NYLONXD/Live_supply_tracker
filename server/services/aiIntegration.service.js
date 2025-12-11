const axios = require('axios');
const logger = require('../utils/logger.utils');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai';

class AIIntegrationService {
  
  // Calculate ETA and route
  async calculateETA(pickupCoords, deliveryCoords) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/calculate-eta`, {
        pickup: pickupCoords,
        delivery: deliveryCoords,
      }, {
        timeout: 10000,
      });
      
      return response.data;
      // Expected: { estimatedMinutes, distance, route }
    } catch (error) {
      logger.error(`AI ETA calculation failed: ${error.message}`);
      
      // Fallback calculation
      const distance = this.calculateDistance(pickupCoords, deliveryCoords);
      return {
        estimatedMinutes: Math.ceil(distance * 3), // ~20km/h avg
        distance: parseFloat(distance.toFixed(2)),
        route: null,
      };
    }
  }
  
  // Validate and geocode address
  async validateAddress(address) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/validate-address`, {
        address,
      }, {
        timeout: 5000,
      });
      
      return response.data;
      // Expected: { valid, formatted, lat, lng }
    } catch (error) {
      logger.error(`AI address validation failed: ${error.message}`);
      return { valid: false, error: 'Address validation failed' };
    }
  }
  
  // Get address suggestions (autocomplete)
  async getAddressSuggestions(query) {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/suggestions`, {
        params: { query },
        timeout: 3000,
      });
      
      return response.data;
      // Expected: [{ text, lat, lng }, ...]
    } catch (error) {
      logger.error(`AI suggestions failed: ${error.message}`);
      return [];
    }
  }
  
  // Update ETA based on current location
  async updateETA(currentLocation, deliveryLocation) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/update-eta`, {
        current: currentLocation,
        delivery: deliveryLocation,
      }, {
        timeout: 5000,
      });
      
      return response.data;
      // Expected: { estimatedMinutes, distance }
    } catch (error) {
      logger.error(`AI ETA update failed: ${error.message}`);
      
      // Fallback
      const distance = this.calculateDistance(currentLocation, deliveryLocation);
      return {
        estimatedMinutes: Math.ceil(distance * 3),
        distance: parseFloat(distance.toFixed(2)),
      };
    }
  }
  
  // Helper: Haversine distance formula
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLon/2) *    Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new AIIntegrationService();