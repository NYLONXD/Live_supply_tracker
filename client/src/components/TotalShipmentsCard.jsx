import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';

const TotalShipmentsCard = () => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchShipments = () => {
      fetch('http://localhost:5000/api/shipments/analytics')
        .then(res => res.json())
        .then(data => {
          if (data.totalShipments) setTotal(data.totalShipments);
        })
        .catch(err => console.error("Error fetching shipment count", err));
    };

    fetchShipments();

    // Optional: Auto-refresh every 1 min
    const interval = setInterval(fetchShipments, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/10 p-6 rounded-xl shadow-lg flex flex-col justify-center items-center">
      <h2 className="text-xl font-semibold mb-2">📦 Live Shipments Count</h2>
      <p className="text-4xl font-bold text-purple-300">
        <CountUp end={total} duration={2.5} separator="," />
      </p>
    </div>
  );
};

export default TotalShipmentsCard;
