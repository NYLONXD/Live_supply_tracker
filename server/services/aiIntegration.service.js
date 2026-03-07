// server/services/aiIntegration.service.js
const axios = require('axios');
const logger = require('../utils/logger.utils');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

class AIIntegrationService {

  // Get real road distance + base duration from Mapbox Directions API
  async getRoadRoute(fromCoords, toCoords) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const response = await axios.get(url, { timeout: 8000 });

      const route = response.data.routes[0];
      if (!route) throw new Error('No route found');

      return {
        distanceKm: route.distance / 1000,           // meters → km
        baseDurationMin: route.duration / 60,         // seconds → minutes
        baseSpeedKmh: (route.distance / 1000) / (route.duration / 3600), // km/h
        geometry: route.geometry.coordinates,         // polyline for map
      };
    } catch (error) {
      logger.error(`Mapbox Directions failed: ${error.message}`);
      return null;
    }
  }

  async calculateETA(pickupCoords, deliveryCoords, options = {}) {
    const {
      vehicleType = 'Car',
      weather = 'Clear',
      route = 'A',
      trafficFactor = 1.0,
    } = options;

    // Step 1: Get real road distance from Mapbox
    const roadData = await this.getRoadRoute(pickupCoords, deliveryCoords);

    let distanceKm, baseSpeed, routeGeometry;

    if (roadData) {
      distanceKm = roadData.distanceKm;
      baseSpeed = roadData.baseSpeedKmh;
      routeGeometry = roadData.geometry;
      logger.info(`Mapbox road distance: ${distanceKm.toFixed(2)} km, base speed: ${baseSpeed.toFixed(1)} km/h`);
    } else {
      // Fallback to Haversine only if Mapbox fails
      logger.warn('Falling back to Haversine distance');
      distanceKm = this.haversineDistance(pickupCoords, deliveryCoords);
      baseSpeed = this.getBaseSpeed(vehicleType);
      routeGeometry = null;
    }

    const now = new Date();

    try {
      // Step 2: Send to AI model for weather/vehicle/time adjustments
      logger.info(`Calling AI service: distance=${distanceKm.toFixed(2)}km, vehicle=${vehicleType}, weather=${weather}`);

      const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
        distance: distanceKm,
        base_speed: baseSpeed,
        traffic_factor: trafficFactor,
        vehicle: vehicleType,
        weather: weather,
        route: route,
        time_of_day: now.getHours(),
        day_of_week: now.getDay(),
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      logger.info(`AI ETA: ${response.data.estimated_eta_minutes} min, confidence: ${response.data.confidence}`);

      return {
        estimatedMinutes: response.data.estimated_eta_minutes,
        estimatedHours: response.data.estimated_eta_hours,
        distance: distanceKm,
        confidence: response.data.confidence,
        model: response.data.model_used,
        range: response.data.eta_range,
        factors: response.data.factors,
        routeGeometry,
      };

    } catch (error) {
      logger.error(`AI service failed: ${error.message}`);

      // Fallback: use road distance + vehicle speed
      const estimatedMinutes = (distanceKm / baseSpeed) * 60 * 1.2;

      return {
        estimatedMinutes: Math.ceil(estimatedMinutes),
        estimatedHours: estimatedMinutes / 60,
        distance: distanceKm,
        confidence: 'low',
        model: 'fallback',
        fallback: true,
        routeGeometry,
      };
    }
  }

  // Called when driver location updates — recalculates remaining ETA
  async updateETA(currentLocation, destinationLocation) {
    const roadData = await this.getRoadRoute(currentLocation, destinationLocation);

    let distanceKm, baseSpeed;

    if (roadData) {
      distanceKm = roadData.distanceKm;
      baseSpeed = roadData.baseSpeedKmh;
    } else {
      distanceKm = this.haversineDistance(currentLocation, destinationLocation);
      baseSpeed = 50;
    }

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
        distance: distanceKm,
        base_speed: baseSpeed,
        traffic_factor: 1.0,
        vehicle: 'Car',
        weather: 'Clear',
        route: 'A',
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
      }, { timeout: 5000 });

      return {
        estimatedMinutes: response.data.estimated_eta_minutes,
        distance: distanceKm,
      };
    } catch {
      const estimatedMinutes = (distanceKm / baseSpeed) * 60 * 1.2;
      return {
        estimatedMinutes: Math.ceil(estimatedMinutes),
        distance: distanceKm,
      };
    }
  }

  // Haversine — only used as fallback when Mapbox is unavailable
  haversineDistance(coord1, coord2) {
    const R = 6371;
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) *
      Math.cos(this.deg2rad(coord2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  getBaseSpeed(vehicleType) {
    const speeds = { Car: 60, Bike: 40, Truck: 50, Van: 55 };
    return speeds[vehicleType] || 60;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error(`AI service health check failed: ${error.message}`);
      return null;
    }
  }
}

module.exports = new AIIntegrationService();