// client/src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function useGeolocation(watch = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (err) => {
      let message = 'Unable to get location';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Location permission denied';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Location information unavailable';
          break;
        case err.TIMEOUT:
          message = 'Location request timed out';
          break;
      }
      setError(message);
      setLoading(false);
      toast.error(message);
    };

    if (watch) {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
      setWatchId(id);
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch]);

  const refresh = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    location,
    error,
    loading,
    refresh,
  };
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(value) {
  return (value * Math.PI) / 180;
}