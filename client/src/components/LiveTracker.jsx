import React, { useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useShipments } from '../context/ShipmentsContext';

mapboxgl.accessToken = 'pk.eyJ1Ijoibnlsb254ZCIsImEiOiJjbWJ6ZndlbmUxdWh4MmxzMXVlNHo1bHY4In0.skucR8Fy2ydShwGEp7kvwQ';

const LiveTracker = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const mapContainerRef = useRef(null);
  const { addShipment } = useShipments();

  const geocode = async (place) => {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await res.json();
    return data.features[0]?.geometry.coordinates;
  };

  const getRoute = async () => {
    const from = await geocode(source);
    const to = await geocode(destination);
    if (!from || !to) return alert('Invalid location(s)');

    const routeRes = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );
    const routeData = await routeRes.json();
    const route = routeData.routes[0];
    const predictedETA = route.duration / 3600; // in hours
    setEta(predictedETA);

    // Initialize or update the map
    if (!mapInstance) {
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: from,
        zoom: 6,
      });
      newMap.on('load', () => {
        newMap.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: route.geometry },
        });
        newMap.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ff0077', 'line-width': 4 },
        });
      });
      setMapInstance(newMap);
    } else {
      mapInstance.getSource('route')?.setData({
        type: 'Feature',
        geometry: route.geometry,
      });
      mapInstance.flyTo({ center: from, zoom: 6 });
    }

    // Save shipment using context (auto-updates all consumers)
    await addShipment({
      from: source,
      to: destination,
      lat: to[1], 
      lng: to[0],
      eta: predictedETA
    });
  };


  return (
    <div className="p-4 bg-white rounded-xl mt-4">
      <h3 className="font-semibold text-lg mb-2 text-black">🧭 Live Tracker</h3>
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Start from..."
          className="border p-2 rounded w-full bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Go to..."
          className="border p-2 rounded w-full bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={getRoute}
          className="bg-purple-600 text-white px-4 py-2 rounded whitespace-nowrap"
        >
          Track
        </button>
      </div>

      {eta && (
        <div className="bg-white rounded-2xl p-4 shadow-xl mt-2 text-center">
          <h2 className="text-xl font-semibold text-gray-800">🧠 AI-Predicted ETA</h2>
          <div className="text-3xl font-bold text-indigo-700">{eta.toFixed(2)} hrs</div>
        </div>
      )}

      <div ref={mapContainerRef} className="h-[400px] rounded-xl overflow-hidden mt-4" />
    </div>
  );
};

export default LiveTracker;
// This code defines a LiveTracker component that allows users to input a source and destination location,
// fetches the route using Mapbox APIs, and displays it on a map. It also calculates and displays the AI-predicted ETA based on the route duration.
// The component uses Mapbox
// for mapping and geocoding, and it handles user input for locations. The map updates dynamically based on the input locations.
// The component is styled with Tailwind CSS classes for a modern look and feel.