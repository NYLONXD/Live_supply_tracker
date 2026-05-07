// server/controllers/auth.Controller.js
const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const User      = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const { generateOTP, sendOTPEmail, sendPasswordResetEmail } = require('../utils/email.utils'); // ← changed
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
    _id:              user._id,
    email:            user.email,
    displayName:      user.displayName,
    phone:            user.phone,
    role:             user.role,
    organizationId:   user.organizationId,
    isEmailVerified:  user.isEmailVerified,
    ...extra,
  });
};

// ─── Hash an OTP with SHA-256 ─────────────────────────────────────────────────
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ─── Register (regular user / customer) ──────────────────────────────────────
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

  const otp       = generateOTP();
  const hashedOTP = hashOTP(otp);
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    email:           email.toLowerCase(),
    password:        hashedPassword,
    displayName:     displayName.trim(),
    phone:           phone?.trim() || undefined,
    role:            'user',
    isEmailVerified: false,
    emailOTP:        hashedOTP,
    emailOTPExpire:  otpExpire,
  });

  sendOTPEmail({ to: user.email, name: user.displayName, otp }).catch((err) => {
    logger.error(`Failed to send OTP to ${user.email}: ${err.message}`);
  });

  logger.info(`New user registered (unverified): ${email}`);
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

// ─── Verify Email (OTP) ───────────────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp || otp.toString().length !== 6)
    return res.status(400).json({ message: 'A valid 6-digit OTP is required' });

  const user = await User.findById(req.user._id).select('+emailOTP +emailOTPExpire');

  if (!user)
    return res.status(404).json({ message: 'User not found' });

  if (user.isEmailVerified)
    return res.status(400).json({ message: 'Email is already verified' });

  if (!user.emailOTP || !user.emailOTPExpire)
    return res.status(400).json({ message: 'No OTP found. Please request a new one.' });

  if (user.emailOTPExpire < new Date())
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

  if (user.emailOTP !== hashOTP(otp.toString()))
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

  user.isEmailVerified = true;
  user.emailOTP        = undefined;
  user.emailOTPExpire  = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info(`Email verified for: ${user.email}`);

  return res.status(200).json({
    message:         'Email verified successfully',
    isEmailVerified: true,
  });
});

exports.resendOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+emailOTP +emailOTPExpire');

  if (!user)
    return res.status(404).json({ message: 'User not found' });

  if (user.isEmailVerified)
    return res.status(400).json({ message: 'Email is already verified' });

  const sentRecentlyThreshold = new Date(Date.now() + 9 * 60 * 1000);
  if (user.emailOTPExpire && user.emailOTPExpire > sentRecentlyThreshold) {
    return res.status(429).json({ message: 'Please wait 60 seconds before requesting a new OTP.' });
  }

  const otp = generateOTP();
  user.emailOTP       = hashOTP(otp);
  user.emailOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const sent = await sendOTPEmail({ to: user.email, name: user.displayName, otp });

  if (!sent)
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });

  logger.info(`OTP resent to: ${user.email}`);
  res.status(200).json({ message: 'A new OTP has been sent to your email.' });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('organizationId', 'name slug plan');
  res.json({
    _id:             user._id,
    email:           user.email,
    displayName:     user.displayName,
    phone:           user.phone,
    role:            user.role,
    organization:    user.organizationId,
    isEmailVerified: user.isEmailVerified,
    preferences:     user.preferences,
    lastLogin:       user.lastLogin,
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

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const { displayName, phone, vehicleInfo, vehicleNumber } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (displayName)   user.displayName   = displayName.trim();
  if (phone)         user.phone         = phone.trim();
  if (vehicleInfo)   user.vehicleInfo   = vehicleInfo;
  if (vehicleNumber) user.vehicleNumber = vehicleNumber;

  await user.save();
  logger.info(`Profile updated for: ${user.email}`);
  res.json({
    _id:          user._id,
    email:        user.email,
    displayName:  user.displayName,
    phone:        user.phone,
    role:         user.role,
    vehicleInfo:  user.vehicleInfo,
    vehicleNumber: user.vehicleNumber,
  });
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

  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken  = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const sent = await sendPasswordResetEmail({
    to:       user.email,
    name:     user.displayName || 'there',
    resetUrl,
  });

  if (!sent) {
    logger.error(`Failed to send password reset email to ${user.email}`);
    return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }

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