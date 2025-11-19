// server/controllers/analyticsController.js
const Shipment = require('../models/Shipment');

const getShipmentsPerDay = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const data = await Shipment.aggregate(pipeline);
    const formatted = data.map(d => ({
      date: d._id,
      count: d.count
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get shipment stats" });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const shipments = await Shipment.find();
    const totalShipments = shipments.length;
    const totalETA = shipments.reduce((sum, s) => sum + (s.eta || 0), 0);
    const avgETA = totalShipments > 0 ? totalETA / totalShipments : 0;

    // Count routes
    const routeMap = {};
    shipments.forEach(s => {
      const route = s.from && s.to ? `${s.from} → ${s.to}` : 'Unknown';
      routeMap[route] = (routeMap[route] || 0) + 1;
    });

    const sortedRoutes = Object.entries(routeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const topRoute = sortedRoutes[0]?.name || 'N/A';

    res.json({
      totalShipments,
      averageETA: avgETA,
      topRoute,
      topRoutes: sortedRoutes.slice(0, 6) // Send top 6
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};


module.exports = { getAnalytics };
module.exports = {
  getAnalytics,
  getShipmentsPerDay
};

