// client/src/pages/Driver/Navigation.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, MapPin, Navigation as NavigationIcon, Radio, Zap } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
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
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout title="Navigation">
        <div className="flex h-64 items-center justify-center gap-2 text-destructive">
          <AlertCircle size={24} className="shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          <span className="text-sm font-bold uppercase tracking-widest text-white">Mission not found</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Route Guidance">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6 animate-modern-fade">
          
          <div className="glass-dark border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <Zap size={14} className="text-neon-blue" /> Mission Details
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-neon-green shadow-[0_0_8px_rgba(0,255,102,0.5)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Extraction Point</p>
                  <p className="text-sm font-bold text-white tracking-wide">{shipment.from}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-neon-pink shadow-[0_0_8px_rgba(255,0,102,0.5)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Drop Zone</p>
                  <p className="text-sm font-bold text-white tracking-wide">{shipment.to}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Distance</p>
                  <p className="text-xl font-black tracking-tighter text-white">{shipment.distance ? `${shipment.distance.toFixed(1)} km` : '—'}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Time to Target</p>
                  <p className="text-xl font-black tracking-tighter text-white">{formatETA(currentETA)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-dark border border-white/10 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <Radio size={14} className={isSharing ? 'text-neon-green animate-pulse' : 'text-muted-foreground'} /> 
              Telemetry Link
            </h2>
            
            <div className="space-y-4">
              <Button
                onClick={isSharing ? stopSharing : startSharing}
                variant={isSharing ? 'neon' : 'primary'}
                className={`w-full h-12 text-xs font-bold uppercase tracking-widest ${isSharing ? 'bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20 hover:text-white hover:border-destructive shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-white text-black hover:bg-zinc-200'}`}
                icon={Radio}
              >
                {isSharing ? 'Sever Telemetry Link' : 'Establish Telemetry'}
              </Button>

              <Button
                onClick={openGoogleMaps}
                variant="outline"
                className="w-full h-12 text-xs font-bold uppercase tracking-widest border-white/20 text-white hover:border-neon-blue hover:text-neon-blue"
                disabled={!currentLocation}
                icon={NavigationIcon}
              >
                Engage External Nav
              </Button>

              {isSharing && (
                <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 px-4 py-3 mt-4 text-xs font-bold text-neon-green flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(0,255,102,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-neon-green" />
                  Live coordinates transmitting to command center.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.1s' }}>
          <GoogleShipmentMap shipment={shipment} currentLocation={currentLocation} />
        </div>
      </div>
    </DashboardLayout>
  );
}
