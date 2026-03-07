import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation as NavigationIcon, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Navigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const currentMarker = useRef(null);
  const watchIdRef = useRef(null);

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentETA, setCurrentETA] = useState(null);

  useEffect(() => {
    fetchShipment();
    return () => stopSharing();
  }, [id]);

  useEffect(() => {
    if (shipment && !map.current) {
      initializeMap();
    }
  }, [shipment]);

  const fetchShipment = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      const found = data.find((s) => s._id === id);
      if (!found) {
        toast.error('Shipment not found');
        navigate('/driver/deliveries');
        return;
      }
      setShipment(found);
      setCurrentETA(found.currentETA);
    } catch {
      toast.error('Failed to load shipment');
      navigate('/driver/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    // Use cleaned model fields: delivery.lat/lng
    const destLat = shipment.delivery?.lat;
    const destLng = shipment.delivery?.lng;

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
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><p>${shipment.to}</p>`))
      .addTo(map.current);

    // Draw stored route geometry from DB (no extra Mapbox API call needed)
    if (shipment.routeGeometry?.length > 0) {
      map.current.on('load', () => drawStoredRoute(shipment.routeGeometry));
    }
  };

  // Draw the polyline stored in the shipment — no API call
  const drawStoredRoute = (coordinates) => {
    if (!map.current) return;

    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      },
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#8b5cf6', 'line-width': 4 },
    });

    // Fit map to route bounds
    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.current.fitBounds(bounds, { padding: 60 });
  };

  // Update driver marker on map
  const updateMapMarker = useCallback((location) => {
    if (!map.current) return;

    if (currentMarker.current) currentMarker.current.remove();

    currentMarker.current = new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
      .addTo(map.current);

    map.current.flyTo({ center: [location.lng, location.lat], zoom: 13 });
  }, []);

  // Send location to backend via HTTP — single source of truth
  const sendLocationToServer = useCallback(async (location) => {
    try {
      const { data } = await driverAPI.updateLocation({
        shipmentId: id,
        lat: location.lat,
        lng: location.lng,
      });
      // Update ETA from server response
      if (data.currentETA) setCurrentETA(data.currentETA);
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  }, [id]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setIsSharing(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        updateMapMarker(location);
        sendLocationToServer(location); // HTTP only, no socket emit
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  const handleOpenGoogleMaps = () => {
    if (!currentLocation || !shipment) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${shipment.delivery.lat},${shipment.delivery.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <DashboardLayout title="Navigation">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout title="Navigation">
        <div className="flex items-center justify-center h-64 gap-2 text-red-400">
          <AlertCircle size={20} />
          <span>Shipment not found</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Navigation">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-semibold text-white mb-3">Delivery Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{shipment.from}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{shipment.to}</span>
              </div>
              {shipment.distance && (
                <p className="text-slate-400">Road distance: {shipment.distance.toFixed(1)} km</p>
              )}
              {currentETA && (
                <p className="text-purple-400 font-medium">ETA: ~{Math.round(currentETA)} min</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-3">Location Sharing</h3>
            <div className="space-y-3">
              <Button
                onClick={isSharing ? stopSharing : startSharing}
                variant={isSharing ? 'danger' : 'primary'}
                className="w-full"
              >
                {isSharing ? 'Stop Sharing' : 'Start Sharing'}
              </Button>

              {currentLocation && (
                <Button className="w-full" variant="outline" onClick={handleOpenGoogleMaps} icon={NavigationIcon}>
                  Open in Google Maps
                </Button>
              )}

              {isSharing && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Sharing Live Location
                  </div>
                </div>
              )}
            </div>
          </Card>
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