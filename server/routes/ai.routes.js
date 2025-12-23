const express = require('express');
const router = express.Router();
const aiService = require('../services/aiIntegration.service');
const asyncHandler = require('../utils/asyncHandle.utils');
const { protect } = require('../middleware/auth.middleware');

// @desc    Preview ETA calculation
// @route   POST /api/ai/preview-eta
// @access  Private
router.post('/preview-eta', protect, asyncHandler(async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, vehicleType, weather } = req.body;
  
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ message: 'Coordinates are required' });
  }

  const eta = await aiService.calculateETA(
    { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
    { lat: parseFloat(toLat), lng: parseFloat(toLng) },
    { 
      vehicleType: vehicleType || 'Car',
      weather: weather || 'Clear'
    }
  );
  
  res.status(200).json(eta);
}));

module.exports = router;