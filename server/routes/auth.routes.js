const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePreferences } = require('../controllers/auth.Controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Private routes
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;