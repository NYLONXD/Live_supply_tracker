const express = require('express');
const router = express.Router();
const {
  getMyShipments,
  updateStatus,
  updateLocation,
  addNotes,
} = require('../controllers/driver.Controller');
const { protect, driver } = require('../middleware/auth.middleware');

// All routes require authentication and driver role
router.use(protect);
router.use(driver);

router.get('/shipments', getMyShipments);
router.put('/shipments/:id/status', updateStatus);
router.post('/location', updateLocation);
router.put('/shipments/:id/notes', addNotes);

module.exports = router;