// server/routes/organization.routes.js
const express = require('express');
const router = express.Router();
const {
  registerOrganization,
  getMyOrganization,
  updateOrganization,
} = require('../controllers/organization.Controller');
const { protect, admin } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

// Public — anyone can register a new shop
router.post('/register', registerOrganization);

// Private — only the org's admin
router.get('/me',  protect, attachTenant, admin, getMyOrganization);
router.put('/me',  protect, attachTenant, admin, updateOrganization);

module.exports = router;