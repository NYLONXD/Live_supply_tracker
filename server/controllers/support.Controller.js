// server/controllers/support.Controller.js
const SupportTicket      = require('../models/SupportTicket.models');
const Shipment           = require('../models/Shipment.models');
const User               = require('../models/user.models');
const asyncHandler       = require('../utils/asyncHandle.utils');
const notifService       = require('../services/notification.service');
const logger             = require('../utils/logger.utils');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find the org's admin user to notify them */
async function getOrgAdmin(organizationId) {
  return User.findOne({ organizationId, role: 'admin', isActive: true }).select('_id');
}

// ── POST /api/support  ─────────────────────────────────────────────────────
// Only users and drivers can create tickets. Admins are the resolvers, not requesters.
exports.createTicket = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({
      message: 'Admins cannot raise support tickets. Use your dashboard to manage tickets raised by your team.',
    });
  }

  const {
    category,
    subject,
    description,
    shipmentId,
    trackingNumber,
    priority,
  } = req.body;

  if (!category)    return res.status(400).json({ message: 'Category is required' });
  if (!subject)     return res.status(400).json({ message: 'Subject is required' });
  if (!description) return res.status(400).json({ message: 'Description is required' });

  // Validate shipment if provided — must belong to this org
  let resolvedShipment = null;
  if (shipmentId) {
    resolvedShipment = await Shipment.findOne({
      _id: shipmentId,
      organizationId: req.organizationId,
    });
    if (!resolvedShipment)
      return res.status(404).json({ message: 'Shipment not found in your organization' });
  } else if (trackingNumber) {
    resolvedShipment = await Shipment.findOne({
      trackingNumber,
      organizationId: req.organizationId,
    });
    if (!resolvedShipment)
      return res.status(404).json({ message: 'Shipment not found' });
  }

  const ticket = await SupportTicket.create({
    organizationId: req.organizationId,
    createdBy:      req.user._id,
    category,
    subject:        subject.trim(),
    description:    description.trim(),
    priority:       priority || 'medium',
    shipmentId:     resolvedShipment?._id || undefined,
    trackingNumber: resolvedShipment?.trackingNumber || trackingNumber || undefined,
    messages: [{
      sender:     req.user._id,
      senderRole: req.user.role,
      content:    description.trim(),
    }],
  });

  // Notify the org's admin
  const admin = await getOrgAdmin(req.organizationId);
  if (admin) {
    notifService.supportTicketCreated({
      organizationId: req.organizationId,
      adminId:        admin._id,
      ticket,
      createdBy:      req.user._id,
    }).catch(() => {});
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('createdBy',   'displayName email role')
    .populate('shipmentId',  'trackingNumber from to status');

  logger.info(`Support ticket created: ${ticket.ticketNumber} by ${req.user.email}`);
  res.status(201).json(populated);
});

// ── GET /api/support  ──────────────────────────────────────────────────────
// Admin  → all tickets for their org
// Others → only their own tickets
exports.getTickets = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { organizationId: req.organizationId };

  if (req.user.role !== 'admin') {
    filter.createdBy = req.user._id;
  }

  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('createdBy',  'displayName email role')
      .populate('assignedTo', 'displayName email')
      .populate('shipmentId', 'trackingNumber from to status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages'), // don't load full thread in list view

    SupportTicket.countDocuments(filter),
  ]);

  res.json({
    tickets,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ── GET /api/support/:id  ──────────────────────────────────────────────────
exports.getTicket = asyncHandler(async (req, res) => {
  const filter = {
    _id:            req.params.id,
    organizationId: req.organizationId,
  };
  if (req.user.role !== 'admin') {
    filter.createdBy = req.user._id;
  }

  const ticket = await SupportTicket.findOne(filter)
    .populate('createdBy',   'displayName email role')
    .populate('assignedTo',  'displayName email')
    .populate('shipmentId',  'trackingNumber from to status distance currentETA')
    .populate('messages.sender', 'displayName role');

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  res.json(ticket);
});

// ── POST /api/support/:id/reply  ──────────────────────────────────────────
// Admin or ticket owner can reply
exports.replyToTicket = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Reply content is required' });

  const filter = {
    _id:            req.params.id,
    organizationId: req.organizationId,
    status:         { $nin: ['resolved', 'closed'] },
  };
  if (req.user.role !== 'admin') {
    filter.createdBy = req.user._id;
  }

  const ticket = await SupportTicket.findOne(filter);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found or already closed' });

  ticket.messages.push({
    sender:     req.user._id,
    senderRole: req.user.role,
    content:    content.trim(),
  });

  // If admin replies → move to in_progress
  if (req.user.role === 'admin' && ticket.status === 'open') {
    ticket.status     = 'in_progress';
    ticket.assignedTo = req.user._id;
  }

  await ticket.save();

  // ── Notify the other party ─────────────────────────────────────────────
  const isAdminReplying = req.user.role === 'admin';
  const recipientId     = isAdminReplying
    ? ticket.createdBy          // notify ticket owner
    : await getOrgAdmin(req.organizationId).then(a => a?._id); // notify admin

  if (recipientId) {
    notifService.supportTicketReplied({
      organizationId: req.organizationId,
      recipientId,
      actorId: req.user._id,
      ticket,
    }).catch(() => {});
  }

  const populated = await SupportTicket.findById(ticket._id)
    .populate('messages.sender', 'displayName role');

  res.json(populated);
});

// ── PATCH /api/support/:id/status  (admin only) ───────────────────────────
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, priority } = req.body;

  const ticket = await SupportTicket.findOne({
    _id:            req.params.id,
    organizationId: req.organizationId,
  });

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  if (status) {
    ticket.status = status;
    if (status === 'resolved') ticket.resolvedAt = new Date();
    if (status === 'closed')   ticket.closedAt   = new Date();
  }
  if (priority) ticket.priority = priority;

  await ticket.save();

  // Notify ticket creator on resolution
  if (status === 'resolved' || status === 'closed') {
    notifService.supportTicketResolved({
      organizationId: req.organizationId,
      recipientId:    ticket.createdBy,
      ticket,
    }).catch(() => {});
  }

  res.json(ticket);
});

// ── PATCH /api/support/:id/rate  (ticket owner only, after resolved) ──────
exports.rateTicket = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });

  const ticket = await SupportTicket.findOneAndUpdate(
    {
      _id:            req.params.id,
      organizationId: req.organizationId,
      createdBy:      req.user._id,
      status:         { $in: ['resolved', 'closed'] },
    },
    { satisfactionRating: rating },
    { new: true }
  );

  if (!ticket) return res.status(404).json({ message: 'Ticket not found or not yet resolved' });

  res.json(ticket);
});

// ── GET /api/support/shipments  ────────────────────────────────────────────
// Returns the user's own shipments for the ticket-creation dropdown
exports.getMyShipmentsForSupport = asyncHandler(async (req, res) => {
  const query = { organizationId: req.organizationId };

  if (req.user.role === 'user') {
    query.createdBy = req.user._id;
  } else if (req.user.role === 'driver') {
    query.assignedDriver = req.user._id;
  }
  // admin sees all (but they shouldn't reach this ideally)

  const shipments = await Shipment.find(query)
    .select('trackingNumber from to status createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(shipments);
});

// ── GET /api/support/stats  (admin only) ──────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
  const orgFilter = { organizationId: req.organizationId };

  const [total, open, inProgress, resolved, byCategory] = await Promise.all([
    SupportTicket.countDocuments(orgFilter),
    SupportTicket.countDocuments({ ...orgFilter, status: 'open' }),
    SupportTicket.countDocuments({ ...orgFilter, status: 'in_progress' }),
    SupportTicket.countDocuments({ ...orgFilter, status: 'resolved' }),
    SupportTicket.aggregate([
      { $match: orgFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ total, open, inProgress, resolved, byCategory });
});