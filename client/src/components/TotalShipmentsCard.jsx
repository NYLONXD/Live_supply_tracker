import React, { useEffect, useState, useRef } from 'react';
import CountUp from 'react-countup';
import gsap from 'gsap';
import shipmentImage from '../assets/crane.png';

const TotalShipmentsCard = () => {
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const fetchShipments = () => {
      fetch('http://localhost:5000/api/shipments/analytics')
        .then((res) => res.json())
        .then((data) => {
          if (data.totalShipments !== undefined) {
            setTotal(data.totalShipments);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch((err) => {
          console.error("Error fetching shipment count", err);
          setError(true);
        });
    };

    fetchShipments();
    const interval = setInterval(fetchShipments, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 p-6 rounded-2xl shadow-xl text-white flex flex-col items-center justify-center w-full max-w-sm mx-auto"
    >
      {/* Shipment Image at Top */}
      <img
        src={shipmentImage}
        alt="Shipment Icon"
        className="w-50 h-50 object-contain mb-4 drop-shadow-lg"
      />

      {/* Title */}
      <h2 className="text-xl font-semibold text-purple-200 mb-1">
        🚚 Live Shipments Count
      </h2>

      {/* Live Count */}
      {error ? (
        <p className="text-red-400 text-sm">Error loading shipment data</p>
      ) : (
        <p className="text-4xl font-bold text-white">
          <CountUp end={total} duration={2.5} separator="," />
        </p>
      )}
    </div>
  );
};

export default TotalShipmentsCard;
