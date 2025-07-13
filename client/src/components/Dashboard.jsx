"use client";
import React, { useState } from 'react';
import ShipmentSidebar from './ShipmentSidebar';
import ShipmentHistory from './ShipmentHistory';
import LiveTracker from './LiveTracker';
import { ShipmentsProvider } from '../context/ShipmentsContext';
import ETAPredictor from './ETAPredictor';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ShipmentsProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0f001a] via-[#1a0033] to-[#330044] text-white font-sans flex flex-row overflow-hidden">
        {/* Sidebar */}
        <div className={`fixed md:static inset-y-0 left-0 w-64 md:w-[300px] bg-[#1a0033]/95 backdrop-blur-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 p-4`}>
          <div className="flex justify-between items-center mb-6 md:hidden">
            <span className="text-xl font-bold text-indigo-300">Menu</span>
            <button onClick={toggleSidebar} className="text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ShipmentSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-indigo-200">📦 Live Supply Tracker</h1>
            <button onClick={toggleSidebar} className="text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="hidden md:block text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400 animate-pulse">
            📦 Live Supply Dashboard
          </div>

          {/* Control Panel / Utility Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="group bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out">
              <div className="flex items-center gap-3">
                <span className="text-2xl transform group-hover:scale-110 transition-transform">🔍</span>
                <span className="font-semibold text-indigo-200 group-hover:text-indigo-100">Search / Filter</span>
              </div>
              <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Quickly find shipments with advanced filters.</p>
            </div>
            <div className="group bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out">
              <div className="flex items-center gap-3">
                <span className="text-2xl transform group-hover:scale-110 transition-transform">📊</span>
                <span className="font-semibold text-indigo-200 group-hover:text-indigo-100">Live Stats</span>
              </div>
              <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Real-time insights into your supply chain.</p>
            </div>
            <div className="group bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out">
              <div className="flex items-center gap-3">
                <span className="text-2xl transform group-hover:scale-110 transition-transform">⏱️</span>
                <span className="font-semibold text-indigo-200 group-hover:text-indigo-100">ETA Prediction</span>
              </div>
              <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Accurate delivery time forecasts.</p>
            </div>
          </div>

          {/* Main Content Layout - Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
            {/* Left Section - LiveTracker (takes 2/3 on xl screens) */}
            <div className="xl:col-span-2">
              <div className="relative bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl hover:shadow-purple-700/50 transition-all h-full ">
                <LiveTracker />
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button className="w-10 h-10 text-xl rounded-full bg-white/20 hover:bg-white/30 focus:ring-2 focus:ring-indigo-500 transition-all" aria-label="Zoom in">+</button>
                  <button className="w-10 h-10 text-xl rounded-full bg-white/20 hover:bg-white/30 focus:ring-2 focus:ring-indigo-500 transition-all" aria-label="Zoom out">−</button>
                </div>
              </div>
            </div>

            {/* Right Section - ShipmentHistory and ETAPredictor (takes 1/3 on xl screens) */}
            <div className="space-y-6">
              <div className="bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl hover:shadow-purple-700/50 transition-all">
                <ShipmentHistory />
              </div>
              <div className="bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl hover:shadow-purple-700/50 transition-all">
                <ETAPredictor />
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 md:hidden z-40" onClick={toggleSidebar}></div>
        )}
      </div>
    </ShipmentsProvider>
  );
};

export default Dashboard;