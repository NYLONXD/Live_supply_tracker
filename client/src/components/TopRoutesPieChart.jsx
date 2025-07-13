import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = [
  '#00c9a7',
  '#845ec2',
  '#ffc75f',
  '#f9f871',
  '#f76c6c',
  '#29c7ac'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-purple-500/40">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm">Shipments: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const TopRoutesPieChart = () => {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/shipments/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.topRoutes) setRoutes(data.topRoutes);
      })
      .catch(err => console.error('Error loading top routes:', err));
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur border border-purple-600/20 p-6 rounded-2xl shadow-xl mt-8">
      <h2 className="text-xl font-semibold mb-4 text-white">🚛 Top Shipment Routes</h2>
      {routes.length === 0 ? (
        <p className="text-gray-300 text-center">No route data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={routes}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              isAnimationActive
            >
              {routes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{
                color: 'white',
                fontSize: '0.85rem',
                marginTop: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopRoutesPieChart;
