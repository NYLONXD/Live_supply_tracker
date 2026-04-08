// server/models/SupportTicket.models.js
const mongoose = require('mongoose');

// ── Individual message in the conversation thread ─────────────────────────
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['user', 'driver', 'admin', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  attachments: [String], // URLs if we add file uploads later
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  // ── Multi-tenancy ──────────────────────────────────────────────────────
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },

  // ── Auto-generated human-readable ticket number ────────────────────────
  ticketNumber: {
    type: String,
    unique: true,
    index: true,
  },

  // ── Who opened this ticket ─────────────────────────────────────────────
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ── Support categories ─────────────────────────────────────────────────
  category: {
    type: String,
    enum: ['order_delivery', 'payment_refund', 'report_behavior', 'technical_issue'],
    required: true,
    index: true,
  },

  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  // ── Optional shipment context ──────────────────────────────────────────
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    index: true,
  },
  trackingNumber: {
    type: String,
    trim: true,
  },

  // ── Ticket lifecycle ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  // ── Conversation thread ────────────────────────────────────────────────
  messages: [messageSchema],

  // ── Who is handling it (admin side) ───────────────────────────────────
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  resolvedAt: Date,
  closedAt:   Date,

  // ── Allow user to rate after resolution ───────────────────────────────
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
  },

}, { timestamps: true });

// ── Compound indexes ──────────────────────────────────────────────────────
supportTicketSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ organizationId: 1, createdBy: 1, createdAt: -1 });

// ── Auto-generate ticket number before first save ─────────────────────────
supportTicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.ticketNumber = `TKT-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);