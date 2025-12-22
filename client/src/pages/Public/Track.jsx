import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package, MapPin, Clock, Truck } from 'lucide-react';
import Card from '../../components/common/Card';
import { shipmentAPI } from '../../services/api';

export function PublicTrack() {
  const { trackingNumber } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (trackingNumber) {
      fetchShipment();
    }
  }, [trackingNumber]);

  const fetchShipment = async () => {
    try {
      const { data } = await shipmentAPI.track(trackingNumber);
      setShipment(data);
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Package className="mx-auto mb-4 text-slate-600" size={48} />
          <h2 className="text-xl font-semibold text-slate-400 mb-2">Shipment Not Found</h2>
          <p className="text-slate-500">Please check your tracking number and try again</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Shipment</h1>
          <p className="text-slate-400">Track shipment #{trackingNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Package className="text-purple-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">Shipment Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-white font-medium capitalize">{shipment.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">From</p>
                <p className="text-white">{shipment.from}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">To</p>
                <p className="text-white">{shipment.to}</p>
              </div>
            </div>
          </Card>

          <Card gradient>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">Estimated Arrival</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : 'Calculating...'}
            </p>
            {shipment.driver && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-slate-400" />
                  <span className="text-slate-400">Driver: {shipment.driver.name}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PublicTrack;