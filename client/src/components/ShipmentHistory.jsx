import React, { useState } from 'react';
import { useShipments } from '../context/ShipmentsContext';

const ShipmentHistory = () => {
  const { shipments, loading, editShipment, deleteShipment } = useShipments();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editRoute, setEditRoute] = useState({ from: '', to: '' });

  const filtered = shipments.filter((shipment) => {
    const route = shipment.from && shipment.to ? `${shipment.from} → ${shipment.to}` : shipment.locationName || '';
    return route.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (shipment) => {
    setEditId(shipment._id);
    setEditRoute({ from: shipment.from || '', to: shipment.to || '' });
  };

  const handleEditSave = (id) => {
    editShipment(id, { from: editRoute.from, to: editRoute.to });
    setEditId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">📦 Shipment History</h2>
      <input
        type="text"
        placeholder="Search by location or route..."
        className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md text-black"
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No shipments found.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s, i) => {
            const route = s.from && s.to ? `${s.from} → ${s.to}` : s.locationName || 'Unknown Route';
            const eta = s.eta;
            const lat = s.toLat !== undefined ? s.toLat : s.lat;
            const lng = s.toLng !== undefined ? s.toLng : s.lng;
            const date = s.createdAt ? new Date(s.createdAt).toLocaleString() : (s.timestamp ? new Date(s.timestamp).toLocaleString() : 'No date');
            return (
              <li key={i} className="bg-gray-100 p-3 rounded-lg border text-black">
                {editId === s._id ? (
                  <>
                    <input
                      className="mb-1 px-1 rounded border"
                      value={editRoute.from}
                      onChange={e => setEditRoute({ ...editRoute, from: e.target.value })}
                      placeholder="From"
                    />
                    <input
                      className="mb-1 px-1 rounded border"
                      value={editRoute.to}
                      onChange={e => setEditRoute({ ...editRoute, to: e.target.value })}
                      placeholder="To"
                    />
                    <div className="flex gap-2 mb-2">
                      <button className="bg-green-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleEditSave(s._id)}>Save</button>
                      <button className="bg-gray-400 text-white px-2 py-1 rounded text-xs" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">📍 {route}</div>
                    <div className="text-sm text-gray-600">ETA: {typeof eta === 'number' && !isNaN(eta) ? `${eta.toFixed(2)} hrs` : 'N/A'}</div>
                    <div className="text-xs text-gray-400">🗓️ {date}</div>
                    <div className="text-xs text-gray-500">Lat: {lat}, Lng: {lng}</div>
                    <div className="flex gap-2 mt-2">
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" onClick={() => deleteShipment(s._id)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ShipmentHistory;
// ShipmentHistory.jsx
// This component fetches and displays shipment history with search and filter options.
// It allows users to search by location, filter by date range, and set ETA limits.