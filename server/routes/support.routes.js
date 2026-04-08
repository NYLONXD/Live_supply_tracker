// server/routes/support.routes.js
const express = require('express');
const router  = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  replyToTicket,
  updateStatus,
  rateTicket,
  getMyShipmentsForSupport,
  getStats,
} = require('../controllers/support.Controller');
const { protect, admin } = require('../middleware/auth.middleware');
const { attachTenant }   = require('../middleware/tenant.middleware');

// All support routes require auth + tenant
router.use(protect);
router.use(attachTenant);

// ── Utility endpoints ────────────────────────────────────────────────────────
router.get('/shipments', getMyShipmentsForSupport);   // for dropdown
router.get('/stats',     admin, getStats);             // admin only

// ── Ticket CRUD ──────────────────────────────────────────────────────────────
router.post ('/',                createTicket);
router.get  ('/',                getTickets);
router.get  ('/:id',             getTicket);
router.post ('/:id/reply',       replyToTicket);
router.patch('/:id/status',      admin, updateStatus);  // admin only
router.patch('/:id/rate',        rateTicket);            // ticket owner

module.exports = router;