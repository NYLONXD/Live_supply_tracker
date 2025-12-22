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

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a shipment tracking room
  joinShipment(trackingNumber) {
    if (this.socket) {
      this.socket.emit('join_shipment', trackingNumber);
    }
  }

  // Leave a shipment tracking room
  leaveShipment(trackingNumber) {
    if (this.socket) {
      this.socket.emit('leave_shipment', trackingNumber);
    }
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
    }
  }

  // Listen for status updates
  onStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('status_updated', callback);
    }
  }

  // Listen for ETA updates
  onETAUpdate(callback) {
    if (this.socket) {
      this.socket.on('eta_updated', callback);
    }
  }

  // Listen for shipment assignment
  onShipmentAssigned(callback) {
    if (this.socket) {
      this.socket.on('shipment_assigned', callback);
    }
  }

  // Driver: Update location
  updateLocation(data) {
    if (this.socket) {
      this.socket.emit('update_location', data);
    }
  }

  // Driver: Update status
  updateStatus(data) {
    if (this.socket) {
      this.socket.emit('status_changed', data);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.off('location_updated');
      this.socket.off('status_updated');
      this.socket.off('eta_updated');
      this.socket.off('shipment_assigned');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();