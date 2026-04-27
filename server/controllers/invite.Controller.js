// server/controllers/invite.Controller.js
const crypto        = require('crypto');
const bcrypt        = require('bcryptjs');
const Invite        = require('../models/Invite.models');
const User          = require('../models/user.models');
const Organization  = require('../models/Organization.models');
const asyncHandler  = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const { sendInviteEmail } = require('../utils/email.utils');
const logger        = require('../utils/logger.utils');

const getCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
});

// ─── POST /api/invites ────────────────────────────────────────────────────────
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
    expiresAt:      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${process.env.CLIENT_URL}/join/${token}`;

  if (invite.email) {
    // Fetch the real organization name from DB.
    // req.user.organizationId is a raw ObjectId (protect() does not populate it),
    // so we must do an explicit lookup here instead of using .name on the ObjectId.
    const org = await Organization.findById(req.organizationId).select('name');
    const orgName = org?.name || 'your organization';

    sendInviteEmail({
      to:          invite.email,
      inviterName: req.user.displayName,
      orgName,
      role:        invite.role,
      inviteUrl,
    }).catch((err) => logger.error(`Invite email failed: ${err.message}`));
  }

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
exports.getInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({ organizationId: req.organizationId })
    .populate('invitedBy', 'displayName email')
    .sort({ createdAt: -1 });
  res.json(invites);
});

// ─── GET /api/invites/:token/validate ─────────────────────────────────────────
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
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { displayName, email, password, phone } = req.body;

  const invite = await Invite.findOne({
    token:     req.params.token,
    usedAt:    null,
    expiresAt: { $gt: new Date() },
  });

  if (!invite)
    return res.status(400).json({ message: 'Invite link is invalid or has expired' });

  if (!displayName?.trim())
    return res.status(400).json({ message: 'Full name is required' });

  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const submittedEmail = email?.trim().toLowerCase();

  if (!submittedEmail)
    return res.status(400).json({ message: 'Email is required' });

  if (invite.email && invite.email !== submittedEmail) {
    logger.warn(
      `Invite email mismatch: invite=${invite.email} submitted=${submittedEmail} token=${req.params.token}`
    );
    return res.status(403).json({
      message: 'This invite was created for a different email address',
    });
  }

  const existing = await User.findOne({ email: submittedEmail });
  if (existing)
    return res.status(400).json({ message: 'An account with this email already exists' });

  const salt = await bcrypt.genSalt(10);
  const user = await User.create({
    email:           submittedEmail,
    password:        await bcrypt.hash(password, salt),
    displayName:     displayName.trim(),
    phone:           phone?.trim() || undefined,
    role:            invite.role,
    organizationId:  invite.organizationId,
    isEmailVerified: true,
  });

  invite.usedAt = new Date();
  await invite.save();

  logger.info(
    `Invite accepted (auto-verified): ${submittedEmail} joined as ${invite.role} [org: ${invite.organizationId}]`
  );

  const token = generateToken(user._id);
  res.cookie('token', token, getCookieOptions());

  res.status(201).json({
    _id:            user._id,
    email:          user.email,
    displayName:    user.displayName,
    role:           user.role,
    organizationId: user.organizationId,
    isEmailVerified: true,
  });
});

// ─── DELETE /api/invites/:token ───────────────────────────────────────────────
exports.revokeInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOneAndDelete({
    token:          req.params.token,
    organizationId: req.organizationId,
    usedAt:         null,
  });

  if (!invite)
    return res.status(404).json({ message: 'Invite not found or already used' });

  logger.info(`Invite revoked by ${req.user.email} [org: ${req.organizationId}]`);
  res.json({ message: 'Invite revoked successfully' });
});