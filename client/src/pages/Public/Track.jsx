import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Package, Search, Truck } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GoogleShipmentMap from '../../components/common/GoogleShipmentMap';
import { shipmentAPI } from '../../services/api';
import socketService from '../../services/socket.service';

export default function PublicTrack() {
  const navigate = useNavigate();
  const { trackingNumber } = useParams();
  const [searchValue, setSearchValue] = useState(trackingNumber || '');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(Boolean(trackingNumber));
  const [error, setError] = useState('');

  const currentLocation = useMemo(() => shipment?.currentLocation || null, [shipment]);

  useEffect(() => {
    setSearchValue(trackingNumber || '');
    if (trackingNumber) {
      fetchShipment(trackingNumber);
    } else {
      setShipment(null);
      setLoading(false);
      setError('');
    }

    return () => {
      if (trackingNumber) {
        socketService.leaveShipment(trackingNumber);
      }
      socketService.removeAllListeners();
    };
  }, [trackingNumber]);

  useEffect(() => {
    if (!shipment?.trackingNumber) return;

    socketService.joinShipment(shipment.trackingNumber);

    socketService.onLocationUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, currentLocation: data.location }));
      }
    });

    socketService.onStatusUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, status: data.status }));
      }
    });

    socketService.onETAUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, currentETA: data.newETA }));
      }
    });

    return () => {
      socketService.leaveShipment(shipment.trackingNumber);
      socketService.removeAllListeners();
    };
  }, [shipment?.trackingNumber]);

  const fetchShipment = async (trackingId) => {
    try {
      setLoading(true);
      const { data } = await shipmentAPI.track(trackingId);
      setShipment(data);
      setError('');
    } catch (err) {
      setShipment(null);
      setError(err.response?.data?.message || 'Shipment not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) {
      setError('Please enter a tracking number');
      return;
    }
    navigate(`/track/${value}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card variant="elevated">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-zinc-500">Shipment Tracking</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-black">Track with your shipment ID</h1>
              <p className="mt-2 text-sm text-brand-zinc-500">
                Customers only need the tracking number to see live delivery progress.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-3">
              <Input
                name="tracking"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Enter tracking number"
                icon={Search}
                className="h-11"
                containerClassName="flex-1"
              />
              <Button type="submit" className="h-11 whitespace-nowrap">
                Search
              </Button>
            </form>
          </div>
        </Card>

        {loading && (
          <Card>
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
          </Card>
        )}

        {!loading && error && (
          <Card className="text-center">
            <Package className="mx-auto mb-4 text-brand-zinc-300" size={44} />
            <h2 className="text-xl font-semibold text-black">{error}</h2>
            <p className="mt-2 text-sm text-brand-zinc-500">
              Try the exact tracking ID shared by the business admin.
            </p>
          </Card>
        )}

        {!loading && shipment && (
          <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="rounded-sm bg-black p-3 text-white">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Tracking Number</p>
                    <p className="font-mono text-sm font-semibold text-black">{shipment.trackingNumber}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Status</p>
                    <p className="mt-1 text-base font-semibold text-black">{shipment.status.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Distance</p>
                      <p className="mt-1 text-lg font-bold text-black">{shipment.distance ? `${shipment.distance.toFixed(1)} km` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">ETA</p>
                      <p className="mt-1 text-lg font-bold text-black">{shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : '—'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-black" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Pickup</p>
                      <p className="mt-1 text-black">{shipment.from}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-black" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Delivery</p>
                      <p className="mt-1 text-black">{shipment.to}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {shipment.driver && (
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="rounded-sm bg-zinc-100 p-3">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Driver</p>
                      <p className="font-semibold text-black">{shipment.driver.name}</p>
                      {shipment.driver.phone && <p className="text-sm text-brand-zinc-500">{shipment.driver.phone}</p>}
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <div className="flex items-center gap-3 text-sm text-brand-zinc-600">
                  <Clock size={16} />
                  <span>Live updates appear automatically while this page is open.</span>
                </div>
              </Card>
            </div>

            <Card noPadding className="overflow-hidden">
              <GoogleShipmentMap shipment={shipment} currentLocation={currentLocation} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
