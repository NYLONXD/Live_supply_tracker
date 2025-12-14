const express = require('express');
const router = express.Router();
const { trackShipment } = require('../controllers/tracking.Controller');

// Public route - no authentication required
router.get('/:trackingNumber', trackShipment);

module.exports = router;