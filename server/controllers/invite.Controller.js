// server/controllers/invite.Controller.js
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const Invite   = require('../models/Invite.models');
const User     = require('../models/user.models');
const asyncHandler  = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const logger   = require('../utils/logger.utils');

// ─── Cookie helper ────────────────────────────────────────────────────────────
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

  if (!['driver', 'user'].includes(role))
    return res.status(400).json({ message: 'Role must be "driver" or "user"' });

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

  logger.info(
    `Invite created by ${req.user.email} | role=${role} | email=${invite.email || 'open'} [org: ${req.organizationId}]`
  );

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
// PUBLIC — frontend calls this before showing the join form
// Returns enough info to render the page (org name, role, pre-filled email)
// but NOT the full invite document (don't leak internals)
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
    email:        invite.email || null,   // null = open invite, user can type any email
    role:         invite.role,
    organization: invite.organizationId.name,
  });
});

// ─── POST /api/invites/:token/accept ─────────────────────────────────────────
// PUBLIC — user registers via the invite link
//
// EMAIL SECURITY RULE:
//   If the admin pre-filled an email when creating the invite, the submitted
//   email MUST match exactly (case-insensitive).
//   This prevents an attacker who intercepts the link from registering with
//   a different email and stealing the invite slot.
//
//   If the invite is "open" (no pre-filled email), any valid email is accepted.
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { displayName, email, password, phone } = req.body;

  // ── Re-validate the token (double-check, don't trust the client) ──────────
  const invite = await Invite.findOne({
    token:     req.params.token,
    usedAt:    null,
    expiresAt: { $gt: new Date() },
  });

  if (!invite)
    return res.status(400).json({ message: 'Invite link is invalid or has expired' });

  // ── Basic field validation ────────────────────────────────────────────────
  if (!displayName?.trim())
    return res.status(400).json({ message: 'Full name is required' });

  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const submittedEmail = email?.trim().toLowerCase();

  if (!submittedEmail)
    return res.status(400).json({ message: 'Email is required' });

  // ── EMAIL MISMATCH CHECK ──────────────────────────────────────────────────
  // If the admin targeted this invite at a specific email, enforce it.
  // This is the critical server-side guard — the frontend disabling the field
  // is just UX, not security.
  if (invite.email && invite.email !== submittedEmail) {
    logger.warn(
      `Invite email mismatch: invite=${invite.email} submitted=${submittedEmail} token=${req.params.token}`
    );
    return res.status(403).json({
      message: 'This invite was created for a different email address',
    });
  }

  // ── Duplicate account check ───────────────────────────────────────────────
  const existing = await User.findOne({ email: submittedEmail });
  if (existing)
    return res.status(400).json({ message: 'An account with this email already exists' });

  // ── Create the user — locked to the inviting org ─────────────────────────
  const salt = await bcrypt.genSalt(10);
  const user = await User.create({
    email:          submittedEmail,
    password:       await bcrypt.hash(password, salt),
    displayName:    displayName.trim(),
    phone:          phone?.trim() || undefined,
    role:           invite.role,              // 'driver' or 'user'
    organizationId: invite.organizationId,    // hard-locked to the inviting org
  });

  // ── Mark invite as used (one-time link) ───────────────────────────────────
  invite.usedAt = new Date();
  await invite.save();

  logger.info(
    `Invite accepted: ${submittedEmail} joined as ${invite.role} [org: ${invite.organizationId}]`
  );

  // ── Set auth cookie and return user ───────────────────────────────────────
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
// Admin revokes a pending invite before it is used
exports.revokeInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOneAndDelete({
    token:          req.params.token,
    organizationId: req.organizationId,
    usedAt:         null,              // can't revoke an already-used invite
  });

  if (!invite)
    return res.status(404).json({ message: 'Invite not found or already used' });

  logger.info(`Invite revoked by ${req.user.email} [org: ${req.organizationId}]`);
  res.json({ message: 'Invite revoked successfully' });
});