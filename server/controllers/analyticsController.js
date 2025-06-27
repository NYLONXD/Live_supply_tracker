// server/controllers/analyticsController.js
const Shipment = require('../models/Shipment');

const getAnalytics = async (req, res) => {
  try {
    const shipments = await Shipment.find();

    const totalShipments = shipments.length;

    const totalETA = shipments.reduce((sum, s) => sum + (s.eta || 0), 0);
    const avgETA = totalShipments > 0 ? totalETA / totalShipments : 0;

    const routeMap = {};
    shipments.forEach(s => {
      const route = s.from && s.to ? `${s.from} → ${s.to}` : 'Unknown';
      routeMap[route] = (routeMap[route] || 0) + 1;
    });

    const sortedRoutes = Object.entries(routeMap).sort((a, b) => b[1] - a[1]);
    const topRoute = sortedRoutes[0] ? sortedRoutes[0][0] : 'N/A';

    res.json({
      totalShipments,
      avgETA: avgETA.toFixed(2),
      topRoute,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getAnalytics };
