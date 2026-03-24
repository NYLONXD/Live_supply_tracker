// server/controllers/invite.Controller.js
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const Invite   = require('../models/Invite.models');
const User     = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger   = require('../utils/logger.utils');

// ─── Cookie helper (same as auth.Controller) ──────────────────────────────────
const getCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
});

// ─── POST /api/invites ────────────────────────────────────────────────────────
// Admin creates an invite link (optionally pre-fills email + role)
exports.createInvite = asyncHandler(async (req, res) => {
  const { email, role = 'driver' } = req.body;

  const token = crypto.randomBytes(32).toString('hex');

  const invite = await Invite.create({
    token,
    organizationId: req.organizationId,
    invitedBy:      req.user._id,
    email:          email?.trim().toLowerCase() || undefined,
    role,
    expiresAt:      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  const inviteUrl = `${process.env.CLIENT_URL}/join/${token}`;

  logger.info(`Invite created by ${req.user.email} for role=${role} [org: ${req.organizationId}]`);

  res.status(201).json({
    token,
    inviteUrl,
    role:      invite.role,
    email:     invite.email || null,
    expiresAt: invite.expiresAt,
  });
});

// ─── GET /api/invites ─────────────────────────────────────────────────────────
// Admin lists all invites for their org
exports.getInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({ organizationId: req.organizationId })
    .populate('invitedBy', 'displayName email')
    .sort({ createdAt: -1 });

  res.json(invites);
});

// ─── GET /api/invites/:token/validate ─────────────────────────────────────────
// PUBLIC — frontend calls this to check the token before showing the form
exports.validateInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({
    token:     req.params.token,
    usedAt:    null,
    expiresAt: { $gt: new Date() },
  }).populate('organizationId', 'name');

  if (!invite)
    return res.status(400).json({ message: 'Invite link is invalid or has expired' });

  res.json({
    valid:        true,
    email:        invite.email || null,
    role:         invite.role,
    organization: invite.organizationId.name,
  });
});

// ─── POST /api/invites/:token/accept ─────────────────────────────────────────
// PUBLIC — user registers via the invite link
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { displayName, email, password, phone } = req.body;

  // Re-check token validity
  const invite = await Invite.findOne({
    token:     req.params.token,
    usedAt:    null,
    expiresAt: { $gt: new Date() },
  });

  if (!invite)
    return res.status(400).json({ message: 'Invite link is invalid or has expired' });

  // Email: prefer what admin pre-filled, fall back to what user typed
  const finalEmail = (invite.email || email || '').toLowerCase().trim();
  if (!finalEmail)
    return res.status(400).json({ message: 'Email is required' });

  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (!displayName?.trim())
    return res.status(400).json({ message: 'Full name is required' });

  // Check for duplicate email
  if (await User.findOne({ email: finalEmail }))
    return res.status(400).json({ message: 'An account with this email already exists' });

  // Create user — locked to the inviting org
  const salt = await bcrypt.genSalt(10);
  const user = await User.create({
    email:          finalEmail,
    password:       await bcrypt.hash(password, salt),
    displayName:    displayName.trim(),
    phone:          phone?.trim() || undefined,
    role:           invite.role,             // 'driver' or 'user'
    organizationId: invite.organizationId,   // ← hard-locked to this org
  });

  // Mark invite as used so it can't be reused
  invite.usedAt = new Date();
  await invite.save();

  logger.info(`Invite accepted: ${finalEmail} joined as ${invite.role} [org: ${invite.organizationId}]`);

  // Set auth cookie + return user object
  const token = generateToken(user._id);
  res.cookie('token', token, getCookieOptions());

  res.status(201).json({
    _id:            user._id,
    email:          user.email,
    displayName:    user.displayName,
    role:           user.role,
    organizationId: user.organizationId,
  });
});

// ─── DELETE /api/invites/:token ───────────────────────────────────────────────
// Admin revokes a pending invite
exports.revokeInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOneAndDelete({
    token:          req.params.token,
    organizationId: req.organizationId,
    usedAt:         null,
  });

  if (!invite)
    return res.status(404).json({ message: 'Invite not found or already used' });

  res.json({ message: 'Invite revoked successfully' });
});