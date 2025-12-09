import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const COLORS = ['#00c9a7', '#845ec2', '#ffc75f', '#f9f871', '#f76c6c', '#29c7ac', '#b76fff'];

const normalizeRoute = (route) =>
  route.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/gi, '');

const groupSimilarRoutes = (routes) => {
  const grouped = {};
  routes.forEach(({ name, value }) => {
    const normalized = normalizeRoute(name);
    if (!grouped[normalized]) {
      grouped[normalized] = { name, value };
    } else {
      grouped[normalized].value += value;
    }
  });
  return Object.values(grouped);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-purple-500/40">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm">Shipments: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const TopRoutesMapPie = () => {
  const [routes, setRoutes] = useState([]);
  const [mapData, setMapData] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const geocode = async (place) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          place
        )}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      return data.features?.[0]?.geometry?.coordinates;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/shipments/analytics')
      .then((res) => res.json())
      .then(async (data) => {
        if (data.topRoutes?.length) {
          const grouped = groupSimilarRoutes(data.topRoutes);
          setRoutes(grouped);

          const geocodedRoutes = await Promise.all(
            grouped.slice(0, 6).map(async (route) => {
              const [from, to] = route.name.split('to').map((p) => p.trim());
              if (!from || !to) return null;
              const fromCoords = await geocode(from);
              const toCoords = await geocode(to);
              if (fromCoords && toCoords) {
                return {
                  name: route.name,
                  coords: [fromCoords, toCoords],
                };
              }
              return null;
            })
          );

          setMapData(geocodedRoutes.filter(Boolean));
        }
      })
      .catch((err) => console.error('Error fetching top routes:', err));
  }, []);

  useEffect(() => {
    if (!mapData.length || mapInstance.current) return;

    const container = mapRef.current;
    if (!container || container.offsetHeight < 100) return;

    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [78.9629, 20.5937],
      zoom: 4.2,
    });

    map.on('load', () => {
      map.resize(); // ✅ force correct rendering

      mapData.forEach(({ coords }, i) => {
        map.addSource(`route-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        });

        map.addLayer({
          id: `route-layer-${i}`,
          type: 'line',
          source: `route-${i}`,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': COLORS[i % COLORS.length],
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });
      });
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapData]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 p-6 rounded-2xl shadow-xl text-white">
      <h2 className="text-xl font-semibold mb-4">🗺️ Top Shipment Routes (Map + Pie)</h2>

      {routes.length === 0 ? (
        <p className="text-gray-300 text-center">No route data available</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 h-full">
          {/* Map */}
          <div className="h-[400px] rounded-xl overflow-hidden border border-white">
            <div ref={mapRef} className="w-full h-full min-h-[400px]" />
          </div>

          {/* Pie Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={routes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(1)}%)`
                  }
                >
                  {routes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ color: 'white', fontSize: '0.85rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopRoutesMapPie;
