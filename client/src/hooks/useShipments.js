// client/src/hooks/useShipments.js
import { useState, useEffect, useCallback } from 'react';
import { shipmentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function useShipments(filters = {}) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await shipmentAPI.getAll(filters);
      setShipments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const createShipment = async (shipmentData) => {
    try {
      const { data } = await shipmentAPI.create(shipmentData);
      setShipments((prev) => [data, ...prev]);
      toast.success('Shipment created successfully');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shipment');
      throw err;
    }
  };

  const updateShipment = async (id, updates) => {
    try {
      const { data } = await shipmentAPI.update(id, updates);
      setShipments((prev) =>
        prev.map((s) => (s._id === id ? data : s))
      );
      toast.success('Shipment updated successfully');
      return data;
    } catch (err) {
      toast.error('Failed to update shipment');
      throw err;
    }
  };

  const deleteShipment = async (id) => {
    try {
      await shipmentAPI.delete(id);
      setShipments((prev) => prev.filter((s) => s._id !== id));
      toast.success('Shipment deleted successfully');
    } catch (err) {
      toast.error('Failed to delete shipment');
      throw err;
    }
  };

  const trackShipment = async (trackingNumber) => {
    try {
      const { data } = await shipmentAPI.track(trackingNumber);
      return data;
    } catch (err) {
      toast.error('Shipment not found');
      throw err;
    }
  };

  return {
    shipments,
    loading,
    error,
    createShipment,
    updateShipment,
    deleteShipment,
    trackShipment,
    refetch: fetchShipments,
  };
}

// Hook for single shipment
export function useShipment(id) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipment = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data } = await shipmentAPI.getById(id);
      setShipment(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch shipment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  return {
    shipment,
    loading,
    error,
    refetch: fetchShipment,
  };
}

// Hook for shipment stats
export function useShipmentStats() {
  const { shipments, loading } = useShipments();

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === 'pending').length,
    assigned: shipments.filter((s) => s.status === 'assigned').length,
    picked_up: shipments.filter((s) => s.status === 'picked_up').length,
    in_transit: shipments.filter((s) => s.status === 'in_transit').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
    cancelled: shipments.filter((s) => s.status === 'cancelled').length,
  };

  return { stats, loading };
}