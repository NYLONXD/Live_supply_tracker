const Shipment = require('../models/Shipment.models');
const Route = require('../models/Router.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { cache } = require('../config/redis.config');

// @desc    Get general analytics
// @route   GET /api/analytics
// @access  Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:general';
  
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalShipments, shipments, routes] = await Promise.all([
    Shipment.countDocuments(),
    Shipment.find().select('eta'),
    Route.find().sort({ usageCount: -1 }).limit(6),
  ]);

  const totalETA = shipments.reduce((sum, s) => sum + (s.eta || 0), 0);
  const averageETA = totalShipments > 0 ? totalETA / totalShipments : 0;

  const topRoutes = routes.map(r => ({
    name: `${r.from} → ${r.to}`,
    value: r.usageCount,
  }));

  const analytics = {
    totalShipments,
    averageETA,
    topRoute: topRoutes[0]?.name || 'N/A',
    topRoutes,
  };

  await cache.set(cacheKey, analytics, 600); // 10 min cache

  res.status(200).json(analytics);
});

// @desc    Get shipments per day
// @route   GET /api/analytics/per-day
// @access  Private/Admin
exports.getShipmentsPerDay = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:per-day';
  
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const data = await Shipment.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 } // Last 30 days
  ]);

  const formatted = data.map(d => ({
    date: d._id,
    count: d.count
  }));

  await cache.set(cacheKey, formatted, 600);

  res.status(200).json(formatted);
});

// @desc    Get user-specific analytics
// @route   GET /api/analytics/me
// @access  Private
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  const cacheKey = `analytics:user:${req.user._id}`;
  
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const shipments = await Shipment.find({ userId: req.user._id });

  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const analytics = {
    totalShipments: shipments.length,
    byStatus: statusCounts,
    avgETA: shipments.reduce((sum, s) => sum + s.eta, 0) / shipments.length || 0,
  };

  await cache.set(cacheKey, analytics, 300);

  res.status(200).json(analytics);
});