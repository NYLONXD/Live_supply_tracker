const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getShipmentsPerDay,
} = require('../controllers/analytics.Controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.use(protect);
router.use(admin);

router.get('/', getAnalytics);
router.get('/per-day', getShipmentsPerDay);

module.exports = router;
