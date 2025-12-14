const express = require('express');
const router = express.Router();
const {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} = require('../controllers/shipment.Controller');
const { protect } = require('../middleware/auth.middleware');
const { getAnalytics, getShipmentsPerDay } = require('../controllers/analytics.Controller');

// All routes require authentication
router.use(protect);

// Shipment CRUD
router.route('/')
  .get(getShipments)
  .post(createShipment);

router.route('/:id')
  .get(getShipment)
  .put(updateShipment)
  .delete(deleteShipment);

// Analytics (admin only can be added via middleware)
router.get('/analytics', getAnalytics);
router.get('/analytics/per-day', getShipmentsPerDay);

module.exports = router;
