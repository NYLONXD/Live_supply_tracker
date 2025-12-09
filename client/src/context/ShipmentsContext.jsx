import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';

const ShipmentsContext = createContext();

export function ShipmentsProvider({ children }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current user UID from Firebase Auth
  const getUserId = () => auth.currentUser?.uid;

  // Fetch shipments from backend
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) throw new Error('User not authenticated');
      const res = await fetch('http://localhost:5000/api/shipments' , {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      setShipments(Array.isArray(data) ? data.reverse() : []);
    } catch (err) {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // Listen for auth changes to refetch
    const unsub = auth.onAuthStateChanged(() => fetchShipments());
    return () => unsub();
  }, []);

  // Add a new shipment and refresh list
  const addShipment = async (shipmentData) => {
    const userId = getUserId();
    if (!userId) return;
    await fetch('http://localhost:5000/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(shipmentData),
    });
    await fetchShipments();
  };

  // Edit a shipment by ID
  const editShipment = async (id, update) => {
    const userId = getUserId();
    if (!userId) return;
    await fetch(`http://localhost:5000/api/shipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(update),
    });
    await fetchShipments();
  };

  // Delete a shipment by ID
  const deleteShipment = async (id) => {
    const userId = getUserId();
    if (!userId) return;
    await fetch(`http://localhost:5000/api/shipments/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
    await fetchShipments();
  };

  return (
    <ShipmentsContext.Provider value={{ shipments, loading, addShipment, editShipment, deleteShipment, fetchShipments }}>
      {children}
    </ShipmentsContext.Provider>
  );
}

export function useShipments() {
  return useContext(ShipmentsContext);
}
