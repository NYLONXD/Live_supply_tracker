// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePreferences,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOTP,
  logout,
} = require('../controllers/auth.Controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register',              authLimiter, register);
router.post('/login',                 authLimiter, login);
router.post('/forgot-password',       authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// ─── Email Verification (requires login cookie, but NOT verified status) ──────
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-otp',   protect, authLimiter, resendOTP);

// ─── Private ──────────────────────────────────────────────────────────────────
router.get ('/me',          protect, getMe);
router.put ('/preferences', protect, updatePreferences);
router.put ('/profile',     protect, updateProfile);
router.post('/logout',      protect, logout);

module.exports = router;