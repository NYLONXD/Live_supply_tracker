// server/routes/notification.routes.js
const express = require('express');
const router  = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notification.Controller');
const { protect }      = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

// All notification routes require auth + tenant
router.use(protect);
router.use(attachTenant);

router.get ('/',              getMyNotifications);
router.get ('/unread-count',  getUnreadCount);
router.patch('/read-all',     markAllAsRead);
router.delete('/',            clearAll);
router.patch ('/:id/read',    markAsRead);
router.delete('/:id',         deleteNotification);

module.exports = router;