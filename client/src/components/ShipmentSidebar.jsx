import React, { useState } from 'react';
import { useShipments } from '../context/ShipmentsContext';

export default function ShipmentSidebar() {
  const { shipments, editShipment, deleteShipment } = useShipments();
  const [editId, setEditId] = useState(null);
  const [editRoute, setEditRoute] = useState({ from: '', to: '' });
  const [isOpen, setIsOpen] = useState(true);
  const [statuses, setStatuses] = useState({});

  const handleEdit = (shipment) => {
    setEditId(shipment._id);
    setEditRoute({ from: shipment.from || '', to: shipment.to || '' });
  };

  const handleEditSave = (id) => {
    editShipment(id, { from: editRoute.from, to: editRoute.to });
    setEditId(null);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleStatus = (id) => {
    setStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === 'Done' ? 'In Progress' : 'Done',
    }));
  };

  return (
    <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'w-[260px]' : 'w-12'} bg-gradient-to-b from-purple-800 to-pink-800 text-white h-screen rounded-r-3xl shadow-2xl backdrop-blur-md overflow-hidden`}>
      <button onClick={toggleSidebar} className="absolute top-4 right-4 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-50">
        {isOpen ? '←' : '→'}
      </button>

      {isOpen && (
        <div className="p-6">
          <h2 className="text-3xl font-semibold mb-6">🚚 Shipments</h2>

          {shipments.length === 0 ? (
            <p className="text-purple-200">No shipments yet...</p>
          ) : (
            shipments.slice(0, 4).map((s, idx) => {
              const route = s.from && s.to ? `${s.from} → ${s.to}` : s.locationName || "Unknown Route";
              const eta = s.eta;
              const status = statuses[s._id] || 'In Progress';

              return (
                <div key={s._id || idx} className="mb-3 p-3 rounded-xl bg-white text-black shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-gray-800">{route}</div>
                    <button
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'Done' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'}`}
                      onClick={() => toggleStatus(s._id)}
                    >
                      {status}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">ETA: {typeof eta === 'number' && !isNaN(eta) ? `${eta.toFixed(2)} hrs` : 'N/A'}</div>

                  {editId === s._id ? (
                    <div className="mt-2 space-y-1">
                      <input
                        className="w-full px-2 py-1 rounded border"
                        value={editRoute.from}
                        onChange={e => setEditRoute({ ...editRoute, from: e.target.value })}
                        placeholder="From"
                      />
                      <input
                        className="w-full px-2 py-1 rounded border"
                        value={editRoute.to}
                        onChange={e => setEditRoute({ ...editRoute, to: e.target.value })}
                        placeholder="To"
                      />
                      <div className="flex justify-between gap-2 mt-1">
                        <button className="bg-green-500 text-white px-3 py-1 rounded text-xs" onClick={() => handleEditSave(s._id)}>Save</button>
                        <button className="bg-gray-400 text-white px-3 py-1 rounded text-xs" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between mt-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-xs" onClick={() => deleteShipment(s._id)}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}