import React, { useState } from 'react';
import { useShipments } from '../context/ShipmentsContext';

export default function ShipmentSidebar() {
  const { shipments, editShipment, deleteShipment } = useShipments();
  const [editId, setEditId] = useState(null);
  const [editRoute, setEditRoute] = useState({ from: '', to: '' });

  const handleEdit = (shipment) => {
    setEditId(shipment._id);
    setEditRoute({ from: shipment.from || '', to: shipment.to || '' });
  };

  const handleEditSave = (id) => {
    editShipment(id, { from: editRoute.from, to: editRoute.to });
    setEditId(null);
  };

  return (
    <div className="w-[300px] p-6 bg-gradient-to-b from-purple-800 to-pink-800 text-white h-screen rounded-r-3xl shadow-2xl backdrop-blur-md">
      <h2 className="text-3xl font-semibold mb-6">🚚 Shipments</h2>

      {shipments.length === 0 ? (
        <p className="text-purple-200">No shipments yet...</p>
      ) : (
        shipments.slice(0, 4).map((s, idx) => {
          const route = s.from && s.to ? `${s.from} → ${s.to}` : s.locationName || "Unknown Route";
          const eta = s.eta;
          return (
            <div key={s._id || idx} className="mb-2 p-2 rounded bg-gray-100 text-black flex flex-col gap-1">
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
                  <div className="flex gap-2">
                    <button className="bg-green-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleEditSave(s._id)}>Save</button>
                    <button className="bg-gray-400 text-white px-2 py-1 rounded text-xs" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-gray-800">{route}</div>
                  <div className="text-xs text-gray-500">ETA: {typeof eta === 'number' && !isNaN(eta) ? `${eta.toFixed(2)} hrs` : 'N/A'}</div>
                  <div className="flex gap-2 mt-1">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" onClick={() => deleteShipment(s._id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
