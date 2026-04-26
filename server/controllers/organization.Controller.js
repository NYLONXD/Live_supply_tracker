// server/controllers/organization.Controller.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Organization = require('../models/Organization.models');
const User = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const { generateToken } = require('../middleware/auth.middleware');
const { generateOTP, sendOTPEmail } = require('../utils/email.utils'); // ← changed
const logger = require('../utils/logger.utils');

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');


exports.registerOrganization = asyncHandler(async (req, res) => {
  const { shopName, email, password, displayName, phone } = req.body;

  if (!shopName || !shopName.trim())
    return res.status(400).json({ message: 'Shop name is required' });

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  if (!displayName || !displayName.trim())
    return res.status(400).json({ message: 'Your full name is required' });

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists)
    return res.status(400).json({ message: 'An account with this email already exists' });

  // ── Generate unique slug ──────────────────────────────────────────────────
  let baseSlug = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  let slug = baseSlug;
  let suffix = 1;
  while (await Organization.findOne({ slug })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const organization = await Organization.create({ name: shopName.trim(), slug });

  // ── Hash password + OTP ───────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const otp       = generateOTP();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    email:           email.toLowerCase(),
    password:        hashedPassword,
    displayName:     displayName.trim(),
    phone:           phone?.trim() || undefined,
    role:            'admin',
    organizationId:  organization._id,
    isEmailVerified: false,
    emailOTP:        hashOTP(otp),
    emailOTPExpire:  otpExpire,
  });

  organization.owner = user._id;
  await organization.save();

  // Send OTP — fire-and-forget
  sendOTPEmail({ to: user.email, name: user.displayName, otp }).catch((err) => {
    logger.error(`Failed to send OTP to ${user.email}: ${err.message}`);
  });

  logger.info(`New organization registered (unverified): "${shopName}" by ${email}`);

  const token = generateToken(user._id);
  res.cookie('token', token, getCookieOptions());

  return res.status(201).json({
    _id:            user._id,
    email:          user.email,
    displayName:    user.displayName,
    role:           user.role,
    organizationId: organization._id,
    isEmailVerified: false,
    organization: {
      _id:  organization._id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
    },
  });
});

// ─── Get current org details ──────────────────────────────────────────────────
exports.getMyOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.organizationId);
  if (!org)
    return res.status(404).json({ message: 'Organization not found' });
  return res.json(org);
});

// ─── Update org details ───────────────────────────────────────────────────────
exports.updateOrganization = asyncHandler(async (req, res) => {
  const { name, phone, address, logoUrl } = req.body;
  const org = await Organization.findByIdAndUpdate(
    req.organizationId,
    { $set: { name, phone, address, logoUrl } },
    { new: true, runValidators: true }
  );
  return res.json(org);
});