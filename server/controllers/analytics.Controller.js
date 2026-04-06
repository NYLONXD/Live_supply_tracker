const Shipment = require('../models/Shipment.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { cache } = require('../config/redis.config');

exports.getAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.organizationId;
  const cacheKey = `analytics:overview:${orgId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json(cached);

  const orgFilter = { organizationId: orgId };

  const [totalShipments, shipments] = await Promise.all([
    Shipment.countDocuments(orgFilter),
    Shipment.find(orgFilter).select('currentETA estimatedMinutes status from to'),
  ]);

  const averageETA = shipments.length
    ? shipments.reduce((sum, s) => sum + (s.currentETA || s.estimatedMinutes || 0), 0) / shipments.length
    : 0;

  const byStatus = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  // Top routes by frequency
  const routeCounts = {};
  shipments.forEach((s) => {
    if (s.from && s.to) {
      const key = `${s.from.split(',')[0]} → ${s.to.split(',')[0]}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    }
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }));

  const topRoute = topRoutes[0]?.name || 'N/A';

  const payload = { totalShipments, averageETA, byStatus, topRoutes, topRoute };

  await cache.set(cacheKey, payload, 300);
  res.status(200).json(payload);
});

exports.getShipmentsPerDay = asyncHandler(async (req, res) => {
  const orgId = req.organizationId;
  const cacheKey = `analytics:per-day:${orgId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json(cached);

  const data = await Shipment.aggregate([
    { $match: { organizationId: orgId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
    { $sort: { _id: 1 } },
  ]);

  const payload = data.map((entry) => ({ date: entry._id, count: entry.count }));

  await cache.set(cacheKey, payload, 300);
  res.status(200).json(payload);
});