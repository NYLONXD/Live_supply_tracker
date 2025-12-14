const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const asyncHandler = require('../utils/asyncHandle.utils');

// Verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-__v');
    
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
});

// Check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin()) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Check if user is driver
exports.driver = (req, res, next) => {
  if (req.user && req.user.isDriver()) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as driver' });
  }
};


// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};