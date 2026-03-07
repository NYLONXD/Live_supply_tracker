// client/src/services/socket.service.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => console.log('Socket connected:', this.socket.id));
      this.socket.on('disconnect', () => console.log('Socket disconnected'));
      this.socket.on('connect_error', (err) => console.error('Socket error:', err));
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinShipment(trackingNumber) {
    this.socket?.emit('join_shipment', trackingNumber);
  }

  leaveShipment(trackingNumber) {
    this.socket?.emit('leave_shipment', trackingNumber);
  }

  // Listeners — receive only, no emit for location (HTTP handles that)
  onLocationUpdate(callback) {
    this.socket?.on('location_updated', callback);
  }

  onStatusUpdate(callback) {
    this.socket?.on('status_updated', callback);
  }

  onETAUpdate(callback) {
    this.socket?.on('eta_updated', callback);
  }

  onShipmentAssigned(callback) {
    this.socket?.on('shipment_assigned', callback);
  }

  removeAllListeners() {
    this.socket?.off('location_updated');
    this.socket?.off('status_updated');
    this.socket?.off('eta_updated');
    this.socket?.off('shipment_assigned');
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();