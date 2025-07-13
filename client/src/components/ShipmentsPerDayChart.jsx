import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ShipmentsPerDayChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/shipments/analytics/per-day')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error loading chart:', err));
  }, []);

  return (
    <div className="bg-white/10 p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-semibold mb-4">📦 Shipments Per Day</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#00ffd0" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShipmentsPerDayChart;
