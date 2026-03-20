// server/controllers/auth.Controller.js
const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const nodemailer = require('nodemailer');
const User      = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger    = require('../utils/logger.utils');

// ─── Cookie options ────────────────────────────────────────────────────────────
const getCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
});

const sendAuthResponse = (res, statusCode, user, extra = {}) => {
  const token = generateToken(user._id);
  res.cookie('token', token, getCookieOptions());
  return res.status(statusCode).json({
    _id:            user._id,
    email:          user.email,
    displayName:    user.displayName,
    phone:          user.phone,
    role:           user.role,
    organizationId: user.organizationId,
    ...extra,
  });
};

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Register ─────────────────────────────────────────────────────────────────
// NOTE: This endpoint is for regular users (customers/viewers).
// To register a new shop with admin access, use POST /api/organizations/register
exports.register = asyncHandler(async (req, res) => {
  const { email, password, displayName, phone } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (!displayName || !displayName.trim())
    return res.status(400).json({ message: 'Full name is required' });

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists)
    return res.status(400).json({ message: 'An account with this email already exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email:       email.toLowerCase(),
    password:    hashedPassword,
    displayName: displayName.trim(),
    phone:       phone?.trim() || undefined,
    role:        'user',
    // organizationId is NOT set here — regular users aren't tied to a shop
  });

  logger.info(`New user registered: ${email}`);
  sendAuthResponse(res, 201, user);
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid email or password' });

  if (!user.isActive)
    return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);
  sendAuthResponse(res, 200, user);
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('organizationId', 'name slug plan');
  res.json({
    _id:          user._id,
    email:        user.email,
    displayName:  user.displayName,
    phone:        user.phone,
    role:         user.role,
    organization: user.organizationId,
    preferences:  user.preferences,
    lastLogin:    user.lastLogin,
  });
});

// ─── Update Preferences ───────────────────────────────────────────────────────
exports.updatePreferences = asyncHandler(async (req, res) => {
  const { notifications, theme } = req.body;
  const user = await User.findById(req.user._id);
  if (notifications !== undefined) user.preferences.notifications = notifications;
  if (theme)                        user.preferences.theme = theme;
  await user.save();
  res.json({ preferences: user.preferences });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always return 200 — don't leak whether email exists
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/user/reset-password?token=${token}`;

  await transporter.sendMail({
    from:    process.env.EMAIL_USER,
    to:      user.email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: 'Invalid or expired reset token' });

  const salt = await bcrypt.genSalt(10);
  user.password            = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendAuthResponse(res, 200, user);
});