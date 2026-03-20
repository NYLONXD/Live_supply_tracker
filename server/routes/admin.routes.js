// server/routes/admin.routes.js
const express = require('express');
const router  = express.Router();
const {
  getAllUsers,
  promoteToDriver,
  demoteDriver,
  getAllDrivers,
  updateDriver,
  toggleUserStatus,
  assignDriverToShipment,
} = require('../controllers/admin.Controller');
const { protect, admin }   = require('../middleware/auth.middleware');
const { attachTenant }     = require('../middleware/tenant.middleware');

// All admin routes require: valid JWT  →  belongs to an org  →  is an admin
router.use(protect);
router.use(attachTenant);
router.use(admin);

// User management
router.get('/users',                     getAllUsers);
router.post('/users/:id/promote-driver', promoteToDriver);
router.post('/users/:id/demote-driver',  demoteDriver);
router.patch('/users/:id/toggle',        toggleUserStatus);

// Driver management
router.get('/drivers',       getAllDrivers);
router.put('/drivers/:id',   updateDriver);

// Shipment assignment
router.post('/shipments/:id/assign', assignDriverToShipment);

module.exports = router;