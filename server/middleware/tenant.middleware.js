// server/middleware/tenant.middleware.js
//
// This middleware runs AFTER protect() and injects req.organizationId.
// All controllers use req.organizationId to scope their DB queries,
// so Shop A can never accidentally read Shop B's data.

const asyncHandler = require('../utils/asyncHandle.utils');

exports.attachTenant = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      message: 'Your account is not linked to any organization. Please contact support.',
    });
  }

  // Make it available as a shorthand throughout the request lifecycle
  req.organizationId = req.user.organizationId;
  next();
});