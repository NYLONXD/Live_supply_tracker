const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment'); // Make sure this model exists

// Save shipment to DB
router.post('/api/shipments', async (req, res) => {
  try {
    const { source, destination, lat, lng, eta } = req.body;
    const shipment = new Shipment({
      from: source,
      to: destination,
      toLat: lat,
      toLng: lng,
      eta,
      createdAt: new Date()
    });
    await shipment.save();
    res.status(201).json({ message: 'Shipment saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save shipment' });
  }
});

// Edit shipment by ID
router.put('/api/shipments/:id', async (req, res) => {
  try {
    const update = req.body;
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// Delete shipment by ID
router.delete('/api/shipments/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Shipment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

module.exports = router;