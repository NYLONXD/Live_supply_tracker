// server/controllers/notification.Controller.js
const Notification  = require('../models/Notification.models');
const asyncHandler  = require('../utils/asyncHandle.utils');

// ── GET /api/notifications
// Returns the authenticated user's notifications (org-scoped, paginated)
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {
    organizationId: req.organizationId,
    recipient:      req.user._id,
  };

  if (req.query.unread === 'true') {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'displayName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      organizationId: req.organizationId,
      recipient:      req.user._id,
      isRead:         false,
    }),
  ]);

  res.json({
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    unreadCount,
  });
});

// ── GET /api/notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    organizationId: req.organizationId,
    recipient:      req.user._id,
    isRead:         false,
  });
  res.json({ count });
});

// ── PATCH /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    {
      _id:            req.params.id,
      recipient:      req.user._id,
      organizationId: req.organizationId,
    },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notif) return res.status(404).json({ message: 'Notification not found' });

  res.json(notif);
});

// ── PATCH /api/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      organizationId: req.organizationId,
      recipient:      req.user._id,
      isRead:         false,
    },
    { isRead: true, readAt: new Date() }
  );

  res.json({ message: 'All notifications marked as read' });
});

// ── DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id:            req.params.id,
    recipient:      req.user._id,
    organizationId: req.organizationId,
  });

  if (!notif) return res.status(404).json({ message: 'Notification not found' });

  res.json({ message: 'Notification deleted' });
});

// ── DELETE /api/notifications
exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    organizationId: req.organizationId,
    recipient:      req.user._id,
    isRead:         true, // only clear read ones
  });

  res.json({ message: 'Read notifications cleared' });
});