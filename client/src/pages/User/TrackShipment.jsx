// client/src/pages/User/TrackShipment.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Clock, User, Phone, Package, Activity, Navigation, Box } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { shipmentAPI } from '../../services/api';
import socketService from '../../services/socket.service';
import toast from 'react-hot-toast';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function TrackShipment() {
  const { id } = useParams();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const driverMarker = useRef(null);

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipment();

    return () => {
      socketService.removeAllListeners();
    };
  }, [id]);

  useEffect(() => {
    if (shipment && !map.current) {
      initializeMap();
      socketService.joinShipment(shipment.trackingNumber);
      setupSocketListeners();
    }
  }, [shipment]);

  const fetchShipment = async () => {
    try {
      const { data } = await shipmentAPI.getById(id);
      setShipment(data);
    } catch {
      toast.error('Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onLocationUpdate((data) => {
      if (data.shipmentId === id) {
        setShipment((prev) => ({ ...prev, currentLocation: data.location }));
        updateDriverMarker(data.location);
      }
    });

    socketService.onStatusUpdate((data) => {
      if (data.shipmentId === id) {
        setShipment((prev) => ({ ...prev, status: data.status }));
        toast.success(`Status updated: ${data.status}`);
      }
    });

    socketService.onETAUpdate((data) => {
      if (data.shipmentId === id) {
        setShipment((prev) => ({ ...prev, currentETA: data.newETA }));
      }
    });
  };

  const initializeMap = () => {
    const destLat = shipment.delivery.lat;
    const destLng = shipment.delivery.lng;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Light style for premium consumer aesthetic
      center: [destLng, destLat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    // Create custom DOM element for destination marker
    const el = document.createElement('div');
    el.className = 'w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10';
    el.innerHTML = '<div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>';

    // Destination marker
    new mapboxgl.Marker({ element: el })
      .setLngLat([destLng, destLat])
      .addTo(map.current);

    // Draw stored route geometry
    if (shipment.routeGeometry?.length > 0) {
      map.current.on('load', () => {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: shipment.routeGeometry },
          },
        });

        // Add line border (outline)
        map.current.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#000000', 'line-width': 6, 'line-opacity': 0.1 },
        });

        // Add main line
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#000000', 'line-width': 4 },
        });

        const bounds = shipment.routeGeometry.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(shipment.routeGeometry[0], shipment.routeGeometry[0])
        );
        map.current.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 80, right: 80 } });
      });
    }

    // Driver location marker if already tracking
    if (shipment.currentLocation) {
      updateDriverMarker(shipment.currentLocation);
    }
  };

  const updateDriverMarker = (location) => {
    if (!map.current) return;

    if (driverMarker.current) driverMarker.current.remove();

    const el = document.createElement('div');
    el.className = 'w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 shadow-xl z-20';
    el.innerHTML = '<div class="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-black"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>';

    driverMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);
  };

  if (loading) {
    return (
      <DashboardLayout title="Live Telemetry">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin shadow-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) return null;

  return (
    <DashboardLayout title="Live Tracking">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px] animate-modern-fade">
        
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Tracking Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-zinc-200 transition-colors duration-500" />
            
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2 relative z-10">
              <Activity size={16} className="text-black" />
              Live Telemetry
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Hash ID</p>
                <p className="font-mono text-sm font-bold text-black bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200/50 inline-block">
                  {shipment.trackingNumber}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Current Status</p>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {shipment.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                {shipment.distance && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distance</p>
                    <p className="text-lg font-black tracking-tighter text-black">{shipment.distance.toFixed(1)} <span className="text-[10px] text-zinc-400">km</span></p>
                  </div>
                )}
                {shipment.currentETA && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">ETA</p>
                    <p className="text-lg font-black tracking-tighter text-black">~{formatETA(shipment.currentETA)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Route Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <Navigation size={16} className="text-black" />
              Transit Route
            </h3>
            
            <div className="flex items-stretch gap-4">
              <div className="flex flex-col items-center gap-1.5 pt-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-black shrink-0 border-2 border-white shadow-sm" />
                <div className="w-0.5 flex-1 bg-zinc-200 rounded-full" />
                <div className="w-2.5 h-2.5 rounded-full border-2 border-black bg-white shrink-0 shadow-sm" />
              </div>
              
              <div className="flex flex-col justify-between min-h-[70px]">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Origin</p>
                  <p className="text-sm font-semibold text-black leading-tight">{shipment.from}</p>
                </div>
                <div className="mt-5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Destination</p>
                  <p className="text-sm font-semibold text-black leading-tight">{shipment.to}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Card */}
          {shipment.assignedDriver && (
            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <User size={16} className="text-black" />
                Courier
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200/50 shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-black">{shipment.assignedDriver.displayName}</p>
                  {shipment.assignedDriver.phone && (
                    <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                      <Phone size={12} />
                      <span className="text-xs font-semibold">{shipment.assignedDriver.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl h-full p-2 shadow-2xl overflow-hidden relative">
             <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl border border-zinc-200 shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-black">Live Satellite Link</span>
             </div>
            <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}