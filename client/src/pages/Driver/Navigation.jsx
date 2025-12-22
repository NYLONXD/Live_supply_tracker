// client/src/pages/Driver/Navigation.jsx - COMPLETE VERSION
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation as NavigationIcon, Phone, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { driverAPI } from '../../services/api';
import { useDriverLocation } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoibnlsb254ZCIsImEiOiJjbWJ6ZndlbmUxdWh4MmxzMXVlNHo1bHY4In0.skucR8Fy2ydShwGEp7kvwQ';

export default function Navigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const currentMarker = useRef(null);
  
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { isSharing, startSharing, stopSharing } = useDriverLocation(id);

  useEffect(() => {
    fetchShipment();
  }, [id]);

  useEffect(() => {
    if (shipment && !map.current) {
      initializeMap();
    }
  }, [shipment]);

  useEffect(() => {
    if (isSharing) {
      watchPosition();
    }
  }, [isSharing]);

  const fetchShipment = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      const foundShipment = data.find((s) => s._id === id);
      
      if (!foundShipment) {
        toast.error('Shipment not found');
        navigate('/driver/deliveries');
        return;
      }
      
      setShipment(foundShipment);
    } catch (error) {
      toast.error('Failed to load shipment');
      navigate('/driver/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    const toLat = shipment.toLat || 28.7041;
    const toLng = shipment.toLng || 77.1025;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [toLng, toLat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add destination marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([toLng, toLat])
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <strong class="text-white">Destination</strong>
            <p class="text-sm text-gray-300">${shipment.to}</p>
          </div>
        `)
      )
      .addTo(map.current);
  };

  const watchPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(location);
        updateMapLocation(location);
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const updateMapLocation = (location) => {
    if (!map.current) return;

    // Remove previous marker
    if (currentMarker.current) {
      currentMarker.current.remove();
    }

    // Add new current location marker
    currentMarker.current = new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([location.lng, location.lat])
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <strong class="text-white">Your Location</strong>
          </div>
        `)
      )
      .addTo(map.current);

    // Fly to current location
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
    });

    // Draw route if we have both locations
    if (shipment) {
      drawRoute(location, {
        lat: shipment.toLat,
        lng: shipment.toLng,
      });
    }
  };

  const drawRoute = async (from, to) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;

      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      };

      // Remove existing route
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Add new route
      map.current.addSource('route', {
        type: 'geojson',
        data: geojson,
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#8b5cf6',
          'line-width': 4,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
    }
  };

  const handleStartNavigation = () => {
    if (currentLocation && shipment) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${shipment.toLat},${shipment.toLng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      toast.error('Unable to start navigation');
    }
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
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-slate-600" size={48} />
            <h3 className="text-lg font-semibold text-slate-400">Shipment not found</h3>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Navigation">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Shipment Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Delivery Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Tracking #</p>
                <p className="font-mono text-purple-400">{shipment.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Destination</p>
                <p className="text-white">{shipment.to}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Customer</p>
                <p className="text-white">{shipment.createdBy?.displayName || 'N/A'}</p>
              </div>
              {shipment.createdBy?.phone && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Contact</p>
                  <a
                    href={`tel:${shipment.createdBy.phone}`}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <Phone size={16} />
                    {shipment.createdBy.phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card gradient>
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={isSharing ? stopSharing : startSharing}
                variant={isSharing ? 'danger' : 'primary'}
              >
                {isSharing ? 'Stop' : 'Start'} Location Sharing
              </Button>

              {currentLocation && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleStartNavigation}
                  icon={NavigationIcon}
                >
                  Open in Google Maps
                </Button>
              )}

              {isSharing && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Location Sharing Active
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-600px p-0 overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}