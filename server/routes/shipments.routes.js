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
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getShipments)
  .post(createShipment);

router.route('/:id')
  .get(getShipment)
  .put(updateShipment)
  .delete(deleteShipment);

module.exports = router;