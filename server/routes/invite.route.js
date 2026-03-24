// server/routes/invite.routes.js
const express = require('express');
const router  = express.Router();
const {
  createInvite,
  getInvites,
  validateInvite,
  acceptInvite,
  revokeInvite,
} = require('../controllers/invite.Controller');
const { protect, admin } = require('../middleware/auth.middleware');
const { attachTenant }   = require('../middleware/tenant.middleware');

// ── Public routes (no auth needed) ───────────────────────────────────────────
// Anyone with the link can validate or accept it
router.get ('/:token/validate', validateInvite);
router.post('/:token/accept',   acceptInvite);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.use(protect, attachTenant, admin);

router.get   ('/',        getInvites);
router.post  ('/',        createInvite);
router.delete('/:token',  revokeInvite);

module.exports = router;