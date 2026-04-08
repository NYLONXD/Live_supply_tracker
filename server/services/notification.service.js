

const Notification = require('../models/Notification.models');
const logger       = require('../utils/logger.utils');

class NotificationService {
  constructor() {
    // io is injected at startup via setIO()
    this._io = null;
  }

  /** Called once in index.js after the Socket.IO server is created. */
  setIO(io) {
    this._io = io;
  }

  /**
   * Create a notification and emit it to the recipient's private room.
   *
   * @param {object} opts
   * @param {string}  opts.organizationId
   * @param {string}  opts.recipient        - User _id
   * @param {string}  [opts.actor]          - User _id who triggered the event
   * @param {string}  opts.type
   * @param {string}  opts.title
   * @param {string}  opts.message
   * @param {object}  [opts.data]           - extra context (shipmentId etc.)
   * @returns {Promise<Notification>}
   */
  async create(opts) {
    try {
      const notif = await Notification.create({
        organizationId: opts.organizationId,
        recipient:      opts.recipient,
        actor:          opts.actor || undefined,
        type:           opts.type,
        title:          opts.title,
        message:        opts.message,
        data:           opts.data || {},
      });

      // Emit in real-time if socket server is available
      if (this._io) {
        this._io
          .to(`user_${opts.recipient.toString()}`)
          .emit('notification', {
            _id:       notif._id,
            type:      notif.type,
            title:     notif.title,
            message:   notif.message,
            data:      notif.data,
            isRead:    false,
            createdAt: notif.createdAt,
          });
      }

      return notif;
    } catch (err) {
      logger.error(`Notification creation failed: ${err.message}`);
      return null;
    }
  }

  // ── Convenience wrappers ──────────────────────────────────────────────────

  async shipmentCreated({ organizationId, adminId, createdBy, shipment }) {
    return this.create({
      organizationId,
      recipient: adminId,
      actor:     createdBy,
      type:      'shipment_created',
      title:     'New Shipment Created',
      message:   `A new shipment (${shipment.trackingNumber}) was created.`,
      data: {
        shipmentId:     shipment._id,
        trackingNumber: shipment.trackingNumber,
        actionUrl:      '/admin/shipments',
      },
    });
  }

  async shipmentAssigned({ organizationId, driverId, adminId, shipment }) {
    return this.create({
      organizationId,
      recipient: driverId,
      actor:     adminId,
      type:      'shipment_assigned',
      title:     'New Delivery Assigned',
      message:   `You have been assigned shipment ${shipment.trackingNumber}.`,
      data: {
        shipmentId:     shipment._id,
        trackingNumber: shipment.trackingNumber,
        actionUrl:      '/driver/deliveries',
      },
    });
  }

  async statusUpdated({ organizationId, adminId, driverId, shipment, status }) {
    const statusLabel = status.replace(/_/g, ' ');
    return this.create({
      organizationId,
      recipient: adminId,
      actor:     driverId,
      type:      'shipment_status_updated',
      title:     'Shipment Status Updated',
      message:   `${shipment.trackingNumber} is now "${statusLabel}".`,
      data: {
        shipmentId:     shipment._id,
        trackingNumber: shipment.trackingNumber,
        actionUrl:      '/admin/shipments',
      },
    });
  }

  async driverPromoted({ organizationId, userId }) {
    return this.create({
      organizationId,
      recipient: userId,
      type:      'driver_promoted',
      title:     'You are now a Driver',
      message:   'Your account has been upgraded to driver. You can now accept deliveries.',
      data: { actionUrl: '/driver/dashboard' },
    });
  }

  async driverDemoted({ organizationId, userId }) {
    return this.create({
      organizationId,
      recipient: userId,
      type:      'driver_demoted',
      title:     'Driver Access Removed',
      message:   'Your driver access has been revoked by an administrator.',
      data: { actionUrl: '/track' },
    });
  }

  async supportTicketCreated({ organizationId, adminId, ticket, createdBy }) {
    return this.create({
      organizationId,
      recipient: adminId,
      actor:     createdBy,
      type:      'support_ticket_created',
      title:     'New Support Ticket',
      message:   `Ticket ${ticket.ticketNumber}: "${ticket.subject}"`,
      data: {
        ticketId:     ticket._id,
        ticketNumber: ticket.ticketNumber,
        actionUrl:    `/admin/support/${ticket._id}`,
      },
    });
  }

  async supportTicketReplied({ organizationId, recipientId, actorId, ticket }) {
    return this.create({
      organizationId,
      recipient: recipientId,
      actor:     actorId,
      type:      'support_ticket_replied',
      title:     'New Reply on Your Ticket',
      message:   `Someone replied to ticket ${ticket.ticketNumber}.`,
      data: {
        ticketId:     ticket._id,
        ticketNumber: ticket.ticketNumber,
        actionUrl:    `/support/tickets/${ticket._id}`,
      },
    });
  }

  async supportTicketResolved({ organizationId, recipientId, ticket }) {
    return this.create({
      organizationId,
      recipient: recipientId,
      type:      'support_ticket_resolved',
      title:     'Your Ticket Has Been Resolved',
      message:   `Ticket ${ticket.ticketNumber} has been marked as resolved.`,
      data: {
        ticketId:     ticket._id,
        ticketNumber: ticket.ticketNumber,
        actionUrl:    `/support/tickets/${ticket._id}`,
      },
    });
  }
}

module.exports = new NotificationService();