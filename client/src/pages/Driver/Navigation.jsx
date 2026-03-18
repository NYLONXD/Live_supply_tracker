import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, MapPin, Navigation as NavigationIcon, Radio } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import GoogleShipmentMap from '../../components/common/GoogleShipmentMap';
import { driverAPI } from '../../services/api';
import socketService from '../../services/socket.service';
import toast from 'react-hot-toast';

export default function Navigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const watchIdRef = useRef(null);

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentETA, setCurrentETA] = useState(null);

  useEffect(() => {
    fetchShipment();

    socketService.onDriverLocationAck((data) => {
      if (data.shipmentId === id) {
        setCurrentETA(data.currentETA);
      }
    });

    socketService.onDriverLocationError((data) => {
      toast.error(data.message || 'Live location update failed');
    });

    return () => {
      stopSharing();
      socketService.removeAllListeners();
    };
  }, [id]);

  const fetchShipment = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      const found = data.find((item) => item._id === id);
      if (!found) {
        toast.error('Shipment not found');
        navigate('/driver/deliveries');
        return;
      }

      setShipment(found);
      setCurrentLocation(found.currentLocation || null);
      setCurrentETA(found.currentETA);
    } catch (error) {
      toast.error('Failed to load shipment');
      navigate('/driver/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const emitLocation = useCallback((location) => {
    socketService.emitDriverLocation({
      shipmentId: id,
      lat: location.lat,
      lng: location.lng,
    });
  }, [id]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
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
        emitLocation(location);
      },
      (error) => {
        setIsSharing(false);
        toast.error(error.message || 'Unable to read current location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  const openGoogleMaps = () => {
    if (!currentLocation || !shipment?.delivery) return;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${shipment.delivery.lat},${shipment.delivery.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <DashboardLayout title="Navigation">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout title="Navigation">
        <div className="flex h-64 items-center justify-center gap-2 text-red-500">
          <AlertCircle size={18} />
          <span>Shipment not found</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Driver Navigation">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-black">Delivery details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-black" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Pickup</p>
                  <p className="mt-1 text-black">{shipment.from}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-black" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Delivery</p>
                  <p className="mt-1 text-black">{shipment.to}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-brand-zinc-200 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Distance</p>
                  <p className="mt-1 text-lg font-bold text-black">{shipment.distance ? `${shipment.distance.toFixed(1)} km` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">ETA</p>
                  <p className="mt-1 text-lg font-bold text-black">{currentETA ? `${Math.round(currentETA)} min` : '—'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-black">Live location sharing</h2>
            <div className="mt-4 space-y-3">
              <Button
                onClick={isSharing ? stopSharing : startSharing}
                variant={isSharing ? 'danger' : 'primary'}
                className="w-full"
                icon={Radio}
              >
                {isSharing ? 'Stop live sharing' : 'Start live sharing'}
              </Button>

              <Button
                onClick={openGoogleMaps}
                variant="outline"
                className="w-full"
                disabled={!currentLocation}
                icon={NavigationIcon}
              >
                Open in Google Maps
              </Button>

              {isSharing && (
                <div className="rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Live location is being sent through WebSocket updates.
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card noPadding className="overflow-hidden">
          <GoogleShipmentMap shipment={shipment} currentLocation={currentLocation} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
