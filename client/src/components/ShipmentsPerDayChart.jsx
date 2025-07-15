import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import gsap from 'gsap';

const ShipmentsPerDayChart = () => {
  const [data, setData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/shipments/analytics/per-day')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Error loading chart:', err));
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      gsap.fromTo(
        chartRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      );
    }
  }, [data]);

  return (
    <div
      ref={chartRef}
      className="bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 p-6 rounded-2xl shadow-xl text-white backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold mb-4 text-white">
         Shipments Per Day
      </h2>
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No shipment data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
            />
            <XAxis dataKey="date" stroke="#aaa" tick={{ fontSize: 12 }} />
            <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e0033',
                border: '1px solid #4c0070',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: 'blue' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="green"
              strokeWidth={3}
              dot={{ r: 4, fill: 'black' }}
              activeDot={{ r: 6 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ShipmentsPerDayChart;
