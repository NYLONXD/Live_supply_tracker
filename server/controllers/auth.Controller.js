const User = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger.utils');

// @desc    Register or login user (Firebase auth)
// @route   POST /api/auth/firebase
// @access  Public
exports.firebaseAuth = asyncHandler(async (req, res) => {
  const { firebaseUid, email, displayName } = req.body;

  if (!firebaseUid || !email) {
    return res.status(400).json({ message: 'Firebase UID and email are required' });
  }

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    // Create new user
    user = await User.create({
      firebaseUid,
      email,
      displayName,
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
    });
    logger.info(`New user created: ${email}`);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    token,
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v');
  res.status(200).json(user);
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res) => {
  const { notifications, theme } = req.body;

  const user = await User.findById(req.user._id);
  
  if (notifications !== undefined) user.preferences.notifications = notifications;
  if (theme) user.preferences.theme = theme;

  await user.save();

  res.status(200).json({
    message: 'Preferences updated',
    preferences: user.preferences,
  });
});