const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');

// ─── Protect ──────────────────────────────────────────────────────────────────
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

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