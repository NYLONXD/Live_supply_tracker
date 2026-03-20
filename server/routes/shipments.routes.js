// server/routes/shipments.routes.js
const express = require('express');
const router = express.Router();
const {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} = require('../controllers/shipment.Controller');
const { protect, admin } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

router.use(protect);
router.use(attachTenant);

router.route('/')
  .get(getShipments)
  .post(admin, createShipment);

router.route('/:id')
  .get(getShipment)
  .put(updateShipment)
  .delete(deleteShipment);

module.exports = router;
