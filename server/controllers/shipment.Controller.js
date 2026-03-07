// server/controllers/shipment.Controller.js
const shipmentService = require('../services/shipment.service');
const asyncHandler = require('../utils/asyncHandle.utils');

exports.getShipments = asyncHandler(async (req, res) => {
  const filters = req.query.status ? { status: req.query.status } : {};
  const shipments = await shipmentService.getShipments(req.user._id, req.user.role, filters);
  res.status(200).json(shipments);
});

exports.getShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentById(req.params.id, req.user._id, req.user.role);
  res.status(200).json(shipment);
});

exports.createShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.createShipment(req.body, req.user._id);
  res.status(201).json(shipment);
});

exports.updateShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.updateShipment(req.params.id, req.body, req.user._id, req.user.role);
  res.status(200).json(shipment);
});

exports.deleteShipment = asyncHandler(async (req, res) => {
  await shipmentService.deleteShipment(req.params.id, req.user._id, req.user.role);
  res.status(200).json({ message: 'Shipment deleted' });
});