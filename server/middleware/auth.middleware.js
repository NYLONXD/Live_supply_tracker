const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');

const getTokenFromCookieHeader = (cookieHeader = '') => {
  const cookies = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === 'token') {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
};

const resolveToken = (req) => {
  const cookieToken = getTokenFromCookieHeader(req.headers.cookie || '');
  if (cookieToken) return cookieToken;

  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

// ─── Protect ──────────────────────────────────────────────────────────────────
exports.protect = asyncHandler(async (req, res, next) => {
  const token = resolveToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fixed: explicitly exclude both password and __v
    req.user = await User.findById(decoded.id).select('-password -__v');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────────
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin()) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// ─── Driver ───────────────────────────────────────────────────────────────────
exports.driver = (req, res, next) => {
  if (req.user && req.user.isDriver()) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as driver' });
  }
};

// ─── Generate Token ───────────────────────────────────────────────────────────
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

exports.getTokenFromCookieHeader = getTokenFromCookieHeader;
exports.resolveToken = resolveToken;
