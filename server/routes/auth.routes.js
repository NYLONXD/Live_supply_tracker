const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePreferences,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/auth.Controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register',              authLimiter, register);
router.post('/login',                 authLimiter, login);
router.post('/forgot-password',       authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword); // ✅ Fixed: added authLimiter

// ─── Private ──────────────────────────────────────────────────────────────────
router.get('/me',          protect, getMe);
router.put('/preferences', protect, updatePreferences);
router.post('/logout',     protect, logout);

module.exports = router;
