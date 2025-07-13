import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useShipments } from '../context/ShipmentsContext';

mapboxgl.accessToken = 'pk.eyJ1Ijoibnlsb254ZCIsImEiOiJjbWJ6ZndlbmUxdWh4MmxzMXVlNHo1bHY4In0.skucR8Fy2ydShwGEp7kvwQ';

const LiveTracker = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const { addShipment } = useShipments();

  // Geocode a location name to coordinates
  const geocode = async (place) => {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await res.json();
    return data.features[0]?.geometry.coordinates;
  };

  const formatETA = (seconds) => {
    const mins = seconds / 60;
    return mins < 60
      ? `${mins.toFixed(1)} minutes`
      : `${(mins / 60).toFixed(2)} hours`;
  };

  const getRouteAndPredict = async () => {
    const from = await geocode(source);
    const to = await geocode(destination);
    if (!from || !to) return alert('Invalid location(s)');

    const routeRes = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );
    const routeData = await routeRes.json();
    const route = routeData.routes[0];
    const duration = route.duration; // in seconds
    const distKm = (route.distance / 1000).toFixed(2);

    setEta(duration);
    setDistance(distKm);

    // Mapbox setup
    if (!mapInstance) {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: from,
        zoom: 6,
      });

      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: route.geometry },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ff0077', 'line-width': 4 },
        });
      });

      setMapInstance(map);
    } else {
      mapInstance.getSource('route')?.setData({
        type: 'Feature',
        geometry: route.geometry,
      });
      mapInstance.flyTo({ center: from, zoom: 6 });
    }

    // Add to shipment history
    await addShipment({
      from: source,
      to: destination,
      lat: to[1],
      lng: to[0],
      eta: duration / 3600, // convert seconds to hours
    });
  };

  return (
    <div className="p-4 bg-white/10 border border-purple-600/40 backdrop-blur-xl rounded-2xl shadow-lg">
      <h3 className="font-semibold text-lg mb-4 text-indigo-300">🧭 Live Tracker</h3>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="From..."
          className="rounded px-3 py-2 w-full bg-white text-black focus:ring-2 focus:ring-purple-500"
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="To..."
          className="rounded px-3 py-2 w-full bg-white text-black focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={getRouteAndPredict}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-all"
        >
          Track
        </button>
      </div>

      {(distance && eta) && (
        <div className="bg-black/30 text-white p-4 rounded-xl mb-4 shadow-inner text-center">
          <p className="text-md font-semibold">🛣️ Distance: <span className="text-indigo-300">{distance} km</span></p>
          <p className="text-md font-semibold">⏱️ ETA: <span className="text-indigo-300">{formatETA(eta)}</span></p>
        </div>
      )}

      <div ref={mapRef} className="h-[400px] rounded-xl overflow-hidden" />
    </div>
  );
};

export default LiveTracker;
