const express = require('express');
const router = express.Router();
const { firebaseAuth, getMe, updatePreferences } = require('../controllers/auth.Controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/firebase', authLimiter, firebaseAuth);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;