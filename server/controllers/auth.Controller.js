const User = require('../models/user.models');
const Driver = require('../models/Driver.models');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger.utils');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  let role = 'user'; // Default role

  // 1. Check if ADMIN (from .env)
  if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
    role = 'admin';
  } 
  // 2. Check if DRIVER (from Driver collection)
  else {
    const driver = await Driver.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });
    if (driver) {
      role = 'driver';
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    displayName: displayName || email.split('@')[0],
    role,
  });

  const token = generateToken(user._id);

  logger.info(`New ${role} registered: ${email}`);

  res.status(201).json({
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    token,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated' });
  }

  let role = user.role;

  // Update role dynamically if needed
  // 1. Check if ADMIN
  if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
    if (role !== 'admin') {
      role = 'admin';
      user.role = 'admin';
      await user.save();
    }
  } 
  // 2. Check if DRIVER
  else {
    const driver = await Driver.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });
    if (driver && role !== 'driver') {
      role = 'driver';
      user.role = 'driver';
      await user.save();
    } else if (!driver && role === 'driver') {
      // Demote back to user if removed from drivers
      role = 'user';
      user.role = 'user';
      await user.save();
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  logger.info(`${role} logged in: ${email}`);

  res.status(200).json({
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    photoURL: user.photoURL,
    token,
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -__v');
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