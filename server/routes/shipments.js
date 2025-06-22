const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

// Middleware to simulate authentication and set req.userId
// In production, replace this with real auth middleware
router.use((req, res, next) => {
  req.userId = req.header('x-user-id') || undefined;
  next();
});

// GET all shipment history (optionally by user)
router.get('/', async (req, res) => {
  try {
    const filter = req.userId ? { userId: req.userId } : {};
    const shipments = await Shipment.find(filter).sort({ createdAt: -1 });
    res.status(200).json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shipment history' });
  }
});

// POST save a new shipment
router.post('/', async (req, res) => {
  const { from, to, eta, fromLat, fromLng, toLat, toLng } = req.body;
  try {
    const shipment = new Shipment({
      from,
      to,
      eta,
      fromLat,
      fromLng,
      toLat,
      toLng,
      createdAt: new Date(),
      userId: req.userId // Save with userId
    });
    await shipment.save();
    res.status(201).json({ message: "Shipment saved", shipment });
  } catch (err) {
    res.status(500).json({ error: "Failed to save shipment", details: err });
  }
});

// PUT edit a shipment by ID
router.put('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// DELETE a shipment by ID
router.delete('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Shipment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;
