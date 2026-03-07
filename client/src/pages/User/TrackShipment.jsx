import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Clock, User, Phone, Package } from 'lucide-react';
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
    // Use cleaned model fields only
    const destLat = shipment.delivery.lat;
    const destLng = shipment.delivery.lng;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [destLng, destLat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Destination marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([destLng, destLat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><br>${shipment.to}`))
      .addTo(map.current);

    // Draw stored route geometry — no extra API call
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

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8b5cf6', 'line-width': 4 },
        });

        const bounds = shipment.routeGeometry.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(shipment.routeGeometry[0], shipment.routeGeometry[0])
        );
        map.current.fitBounds(bounds, { padding: 60 });
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

    driverMarker.current = new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Driver Location</strong>'))
      .addTo(map.current);
  };

  if (loading) {
    return (
      <DashboardLayout title="Track Shipment">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) return null;

  return (
    <DashboardLayout title="Track Shipment">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <Card>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Package size={16} className="text-purple-400" />
              Shipment Info
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Tracking: <span className="text-white font-mono">{shipment.trackingNumber}</span></p>
              <p className="text-slate-400">Status: <span className="text-purple-400 capitalize">{shipment.status}</span></p>
              {shipment.distance && (
                <p className="text-slate-400">Distance: <span className="text-white">{shipment.distance.toFixed(1)} km</span></p>
              )}
              {shipment.currentETA && (
                <p className="text-slate-400">ETA: <span className="text-green-400">~{Math.round(shipment.currentETA)} min</span></p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-purple-400" />
              Route
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{shipment.from}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{shipment.to}</span>
              </div>
            </div>
          </Card>

          {shipment.assignedDriver && (
            <Card>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <User size={16} className="text-purple-400" />
                Driver
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-white">{shipment.assignedDriver.displayName}</p>
                {shipment.assignedDriver.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={12} />
                    <span>{shipment.assignedDriver.phone}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-full p-0 overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}