const crypto = require('crypto');
const User = require('../models/user.models');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger.utils');

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { email, password, displayName, phone } = req.body;

  // ── Validation ───────────────────────────────────────────────────────────────
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (!displayName || !displayName.trim())
    return res.status(400).json({ message: 'Full name is required' });

  // ── Duplicate check ──────────────────────────────────────────────────────────
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists)
    return res.status(400).json({ message: 'An account with this email already exists' });

  // ── Role assignment ──────────────────────────────────────────────────────────
  let role = 'user';
  if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) role = 'admin';

  // ── Create user ──────────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email:       email.toLowerCase(),
    password:    hashedPassword,
    displayName: displayName.trim(),
    phone:       phone?.trim() || undefined, // ✅ store phone if provided
    role,
  });

  const token = generateToken(user._id);
  logger.info(`New ${role} registered: ${email}`);

  res.status(201).json({
    _id:         user._id,
    email:       user.email,
    displayName: user.displayName,
    phone:       user.phone,
    role:        user.role,
    token,
  });
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
  await user.save();

  const token = generateToken(user._id);
  logger.info(`Login: ${email}`);

  res.status(200).json({
    _id:         user._id,
    email:       user.email,
    displayName: user.displayName,
    phone:       user.phone,
    role:        user.role,
    token,
  });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json(user);
});

// ─── Update Preferences ───────────────────────────────────────────────────────
exports.updatePreferences = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.notifications !== undefined)
    updates['preferences.notifications'] = req.body.notifications;
  if (req.body.theme !== undefined)
    updates['preferences.theme'] = req.body.theme;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  res.status(200).json(user);
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return 200 — never reveal whether email exists
  if (!user) {
    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const rawToken    = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken  = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  try {
    await transporter.sendMail({
      from:    `"Supply Tracker" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #6b7280;">You requested a password reset for your Supply Tracker account.</p>
          <p style="color: #6b7280;">This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetURL}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
          <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">
            If you didn't request this, ignore this email. Your password won't change.
          </p>
        </div>
      `,
    });

    logger.info(`Password reset email sent to ${user.email}`);
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (error) {
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.error(`Failed to send reset email: ${error.message}`);
    res.status(500).json({ message: 'Failed to send email. Please try again.' });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token }    = req.params;

  if (!token)
    return res.status(400).json({ message: 'Reset token is required' });

  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user)
    return res.status(400).json({ message: 'Invalid or expired reset link.' });

  const salt           = await bcrypt.genSalt(10);
  user.password        = await bcrypt.hash(password, salt);
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset successful for ${user.email}`);

  const jwtToken = generateToken(user._id);
  res.status(200).json({
    message: 'Password reset successful.',
    token:   jwtToken,
    role:    user.role,
  });
});