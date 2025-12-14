const express = require('express');
const router = express.Router();
const {
  addDriver,
  getAllDrivers,
  removeDriver,
  toggleDriverStatus,
  updateDriver,
  assignDriverToShipment,
} = require('../controllers/admin.Controller');
const { protect, admin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Driver management
router.post('/drivers', addDriver);
router.get('/drivers', getAllDrivers);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', removeDriver);
router.patch('/drivers/:id/toggle', toggleDriverStatus);

// Assign driver to shipment
router.post('/shipments/:id/assign', assignDriverToShipment);

module.exports = router;