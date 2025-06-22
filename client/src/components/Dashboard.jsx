// client/components/Dashboard.jsx
"use client";
import React from 'react';
import ShipmentSidebar from './ShipmentSidebar';
import ShipmentHistory from './ShipmentHistory';
import LiveTracker from './LiveTracker';
import { ShipmentsProvider } from '../context/ShipmentsContext';

const Dashboard = () => {
  return (
    <ShipmentsProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1a0033] via-[#330044] to-[#4c0066] text-white font-sans flex flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-[300px] p-0">
          <ShipmentSidebar />
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          {/* Header */}
          <div className="text-3xl font-bold mb-8">📦 Live Supply Tracker</div>
          {/* Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-purple-700/30 backdrop-blur p-4 rounded-2xl shadow-lg hover:shadow-purple-600 transition-all">
              🔍 <span className="font-semibold">Search / Filter</span>
            </div>
            <div className="bg-white/5 border border-purple-700/30 backdrop-blur p-4 rounded-2xl shadow-lg hover:shadow-purple-600 transition-all">
              📊 <span className="font-semibold">Live Stats</span>
            </div>
            <div className="bg-white/5 border border-purple-700/30 backdrop-blur p-4 rounded-2xl shadow-lg hover:shadow-purple-600 transition-all">
              ⏱️ <span className="font-semibold">ETA Prediction</span>
            </div>
          </div>
          {/* Map and Shipment History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="bg-white/5 border border-purple-700/30 backdrop-blur p-4 rounded-2xl shadow-xl relative flex flex-col">
              <LiveTracker />
              {/* Optional Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="w-10 h-10 text-xl rounded-full bg-white/10 hover:bg-white/20">+</button>
                <button className="w-10 h-10 text-xl rounded-full bg-white/10 hover:bg-white/20">−</button>
              </div>
            </div>
            
            <div className="bg-white/5 border border-purple-700/30 backdrop-blur p-4 rounded-2xl shadow-xl">
              <ShipmentHistory />
              {/* <LiveTracker /> */}
            </div>
          </div>
        </div>
      </div>
    </ShipmentsProvider>
  );
};

export default Dashboard;
