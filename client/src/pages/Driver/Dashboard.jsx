import { useEffect, useState } from 'react';
import { Package, MapPin, CheckCircle, Navigation, Clock, ChevronRight, Truck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { driverAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const STATUS_FLOW = {
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

const STATUS_LABEL = {
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const firstName = user?.displayName?.split(' ')[0] || 'Driver';

  const active = shipments.filter((s) =>
    ['assigned', 'picked_up', 'in_transit'].includes(s.status)
  );
  const delivered = shipments.filter((s) => s.status === 'delivered');
  const primaryJob = active[0] || null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      setShipments(data);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    setUpdatingId(shipmentId);
    try {
      await driverAPI.updateStatus(shipmentId, newStatus);
      toast.success(`Marked as ${STATUS_LABEL[newStatus]}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-zinc-400 mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold tracking-tight text-black">{firstName}</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Package} label="Assigned" value={active.filter((s) => s.status === 'assigned').length} />
        <StatCard icon={Truck} label="In Transit" value={active.filter((s) => s.status !== 'assigned').length} dark />
        <StatCard icon={CheckCircle} label="Delivered" value={delivered.length} />
      </div>

      {/* Primary active job */}
      {primaryJob ? (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-zinc-400 mb-3">Current Job</p>
          <div className="border-2 border-black rounded-sm p-6 bg-white">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="font-mono text-xs text-brand-zinc-500 mb-1">{primaryJob.trackingNumber}</p>
                <StatusBadge status={primaryJob.status} />
              </div>
              <div className="text-right">
                {primaryJob.distance && (
                  <p className="text-lg font-bold text-black">{primaryJob.distance.toFixed(1)} km</p>
                )}
                {primaryJob.currentETA && (
                  <p className="text-xs text-brand-zinc-500 flex items-center gap-1 justify-end">
                    <Clock size={12} /> {Math.round(primaryJob.currentETA)} min ETA
                  </p>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="space-y-2 mb-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-zinc-400">Pickup</p>
                  <p className="text-sm font-medium text-black">{primaryJob.from}</p>
                </div>
              </div>
              <div className="ml-1 w-px h-4 bg-brand-zinc-200" />
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-zinc-400">Delivery</p>
                  <p className="text-sm font-medium text-black">{primaryJob.to}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link to={`/driver/navigate/${primaryJob._id}`} className="flex-1">
                <Button className="w-full" icon={Navigation}>
                  Navigate
                </Button>
              </Link>
              {STATUS_FLOW[primaryJob.status] && (
                <Button
                  variant="outline"
                  className="flex-1"
                  loading={updatingId === primaryJob._id}
                  onClick={() => handleStatusUpdate(primaryJob._id, STATUS_FLOW[primaryJob.status])}
                >
                  Mark {STATUS_LABEL[STATUS_FLOW[primaryJob.status]]}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <Card>
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-brand-zinc-100 rounded-sm flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} className="text-brand-zinc-400" />
              </div>
              <p className="font-bold text-black mb-1">No active deliveries</p>
              <p className="text-sm text-brand-zinc-500">Your admin will assign new jobs shortly.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Queue — remaining active jobs */}
      {active.length > 1 && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-zinc-400 mb-3">
            Up Next ({active.length - 1})
          </p>
          <div className="space-y-3">
            {active.slice(1).map((s) => (
              <QueueCard key={s._id} shipment={s} />
            ))}
          </div>
        </div>
      )}

      {/* Link to all deliveries */}
      <Link to="/driver/deliveries" className="block">
        <div className="flex items-center justify-between p-4 border border-brand-zinc-200 rounded-sm hover:border-black transition-colors group">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-brand-zinc-400" />
            <span className="text-sm font-bold text-black">View All Deliveries</span>
            <span className="text-xs text-brand-zinc-400">({shipments.length} total)</span>
          </div>
          <ChevronRight size={16} className="text-brand-zinc-300 group-hover:text-black transition-colors" />
        </div>
      </Link>

    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, dark }) {
  return (
    <div className={`p-4 border rounded-sm ${dark ? 'bg-black text-white border-black' : 'bg-white border-brand-zinc-200'}`}>
      <Icon size={18} className={dark ? 'text-zinc-400 mb-3' : 'text-brand-zinc-400 mb-3'} />
      <p className={`text-2xl font-bold tracking-tight mb-0.5 ${dark ? 'text-white' : 'text-black'}`}>{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-zinc-500' : 'text-brand-zinc-400'}`}>{label}</p>
    </div>
  );
}

function QueueCard({ shipment }) {
  return (
    <Link to={`/driver/navigate/${shipment._id}`}>
      <div className="flex items-center justify-between p-4 border border-brand-zinc-200 rounded-sm hover:border-black transition-colors group cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <MapPin size={16} className="text-brand-zinc-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-brand-zinc-500">{shipment.trackingNumber}</p>
            <p className="text-sm font-medium text-black truncate">
              {shipment.from?.split(',')[0]} → {shipment.to?.split(',')[0]}
            </p>
          </div>
        </div>
        <ChevronRight size={14} className="text-brand-zinc-300 group-hover:text-black transition-colors shrink-0" />
      </div>
    </Link>
  );
}