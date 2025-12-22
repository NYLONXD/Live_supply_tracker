// client/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import socketService from '../services/socket.service';
import toast from 'react-hot-toast';

export default function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ Socket connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Retrying...');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, []);

  return {
    socket: socketService.getSocket(),
    isConnected,
    joinShipment: socketService.joinShipment.bind(socketService),
    leaveShipment: socketService.leaveShipment.bind(socketService),
    updateLocation: socketService.updateLocation.bind(socketService),
    updateStatus: socketService.updateStatus.bind(socketService),
  };
}

// Hook for tracking shipment updates
export function useShipmentTracking(trackingNumber) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!trackingNumber) return;

    socketService.joinShipment(trackingNumber);

    socketService.onLocationUpdate((data) => {
      if (data.trackingNumber === trackingNumber) {
        setLocation(data.location);
      }
    });

    socketService.onStatusUpdate((data) => {
      if (data.trackingNumber === trackingNumber) {
        setStatus(data.status);
        toast.success(`Status updated: ${data.status}`);
      }
    });

    socketService.onETAUpdate((data) => {
      if (data.trackingNumber === trackingNumber) {
        setEta(data.newETA);
      }
    });

    return () => {
      socketService.leaveShipment(trackingNumber);
      socketService.removeAllListeners();
    };
  }, [trackingNumber]);

  return { location, status, eta };
}

// Hook for driver location updates
export function useDriverLocation(shipmentId) {
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };

        socketService.updateLocation({
          shipmentId,
          location,
        });

        setIsSharing(true);
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
        setIsSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  const stopSharing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsSharing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    isSharing,
    startSharing,
    stopSharing,
  };
}