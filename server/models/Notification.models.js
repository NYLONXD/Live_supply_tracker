// server/models/Notification.models.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // ── Multi-tenancy ────────────────────────────────────────────────────────
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },

  // ── Who receives this notification ───────────────────────────────────────
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ── Who triggered it (optional, for display) ─────────────────────────────
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // ── Type controls icon, colour, and routing on the frontend ─────────────
  type: {
    type: String,
    enum: [
      'shipment_created',        // admin notified when user creates shipment
      'shipment_assigned',       // driver notified when admin assigns them
      'shipment_status_updated', // admin notified when driver updates status
      'driver_promoted',         // user notified when promoted to driver
      'driver_demoted',          // user notified when demoted
      'support_ticket_created',  // admin notified on new ticket
      'support_ticket_replied',  // ticket creator notified on new reply
      'support_ticket_resolved', // ticket creator notified on resolution
      'support_ticket_closed',   // ticket creator notified on close
      'system',                  // generic system notifications
    ],
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  message: {
    type: String,
    required: true,
    trim: true,
  },

  // ── Extra context for deep-linking / display ──────────────────────────────
  data: {
    shipmentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    trackingNumber:  String,
    ticketId:        { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
    ticketNumber:    String,
    actionUrl:       String, // e.g. "/driver/deliveries"
  },

  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },

  readAt: Date,

}, { timestamps: true });

// ── Compound indexes for fast per-user/per-org queries ────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, recipient: 1, createdAt: -1 });

// ── Auto-expire after 90 days ─────────────────────────────────────────────
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

module.exports = mongoose.model('Notification', notificationSchema);