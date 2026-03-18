const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { cache } = require('../config/redis.config');

exports.getAnalytics = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:overview';
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalShipments, shipments] = await Promise.all([
    Shipment.countDocuments(),
    Shipment.find().select('currentETA estimatedMinutes status'),
  ]);

  const averageETA = shipments.length
    ? shipments.reduce((sum, shipment) => sum + (shipment.currentETA || shipment.estimatedMinutes || 0), 0) / shipments.length
    : 0;

  const byStatus = shipments.reduce((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] || 0) + 1;
    return acc;
  }, {});

  const payload = {
    totalShipments,
    averageETA,
    byStatus,
  };

  await cache.set(cacheKey, payload, 300);
  res.status(200).json(payload);
});

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
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
    { $sort: { _id: 1 } },
  ]);

  const payload = data.map((entry) => ({
    date: entry._id,
    count: entry.count,
  }));

  await cache.set(cacheKey, payload, 300);
  res.status(200).json(payload);
});
