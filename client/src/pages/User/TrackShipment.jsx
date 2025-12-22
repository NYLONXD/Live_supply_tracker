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

// Set Mapbox token (you should add this to .env)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoibnlsb254ZCIsImEiOiJjbWJ6ZndlbmUxdWh4MmxzMXVlNHo1bHY4In0.skucR8Fy2ydShwGEp7kvwQ';

export default function TrackShipment() {
  const { id } = useParams();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipment();
    setupSocketListeners();

    return () => {
      if (shipment?.trackingNumber) {
        socketService.leaveShipment(shipment.trackingNumber);
      }
      socketService.removeAllListeners();
    };
  }, [id]);

  useEffect(() => {
    if (shipment && !map.current) {
      initializeMap();
    }
  }, [shipment]);

  const fetchShipment = async () => {
    try {
      const { data } = await shipmentAPI.getById(id);
      setShipment(data);

      // Join socket room for this shipment
      if (data.trackingNumber) {
        socketService.joinShipment(data.trackingNumber);
      }
    } catch (error) {
      toast.error('Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Listen for real-time location updates
    socketService.onLocationUpdate((data) => {
      if (data.shipmentId === id) {
        setShipment((prev) => ({
          ...prev,
          currentLocation: data.location,
        }));
        updateMapMarker(data.location);
      }
    });

    // Listen for status updates
    socketService.onStatusUpdate((data) => {
      if (data.shipmentId === id || data.trackingNumber === shipment?.trackingNumber) {
        setShipment((prev) => ({
          ...prev,
          status: data.status,
        }));
        toast.success(`Status updated: ${data.status}`);
      }
    });

    // Listen for ETA updates
    socketService.onETAUpdate((data) => {
      if (data.shipmentId === id) {
        setShipment((prev) => ({
          ...prev,
          currentETA: data.newETA,
        }));
      }
    });
  };

  const initializeMap = () => {
    const toLat = shipment.delivery?.lat || shipment.toLat || 28.7041;
    const toLng = shipment.delivery?.lng || shipment.toLng || 77.1025;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [toLng, toLat],
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add destination marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([toLng, toLat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><br>${shipment.to}`))
      .addTo(map.current);

    // Add current location marker if available
    if (shipment.currentLocation) {
      updateMapMarker(shipment.currentLocation);
    }
  };

  const updateMapMarker = (location) => {
    if (!map.current) return;

    // Remove existing marker if any
    const existingMarker = document.querySelector('.current-location-marker');
    if (existingMarker) {
      existingMarker.remove();
    }

    // Add new current location marker
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Current Location</strong>'))
      .addTo(map.current);

    // Fly to current location
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 14,
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
      assigned: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      picked_up: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      in_transit: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      delivered: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    };

    const style = config[status] || config.pending;

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
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

  if (!shipment) {
    return (
      <DashboardLayout title="Track Shipment">
        <Card>
          <div className="text-center py-12">
            <Package className="mx-auto mb-4 text-slate-600" size={48} />
            <h3 className="text-lg font-semibold text-slate-400">Shipment not found</h3>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Track Shipment">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <Card>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-slate-400 mb-2">Tracking Number</h3>
                <p className="font-mono text-lg text-purple-400 font-semibold">
                  {shipment.trackingNumber}
                </p>
              </div>

              <div>
                <h3 className="text-sm text-slate-400 mb-2">Current Status</h3>
                {getStatusBadge(shipment.status)}
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin size={16} className="text-green-400" />
                  <span className="text-slate-400">From:</span>
                </div>
                <p className="text-white ml-6">{shipment.from || 'N/A'}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin size={16} className="text-red-400" />
                  <span className="text-slate-400">To:</span>
                </div>
                <p className="text-white ml-6">{shipment.to || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* ETA Card */}
          <Card gradient>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="text-purple-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">Estimated Time</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : 'Calculating...'}
            </p>
            {shipment.distance && (
              <p className="text-sm text-slate-400 mt-2">Distance: {shipment.distance.toFixed(1)} km</p>
            )}
          </Card>

          {/* Driver Info */}
          {shipment.assignedDriver && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="text-blue-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white">Driver Information</h3>
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">{shipment.assignedDriver.displayName}</p>
                {shipment.assignedDriver.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone size={16} />
                    <span>{shipment.assignedDriver.phone}</span>
                  </div>
                )}
                {shipment.assignedDriver.vehicleNumber && (
                  <p className="text-sm text-slate-400">
                    Vehicle: {shipment.assignedDriver.vehicleNumber}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] p-0 overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}