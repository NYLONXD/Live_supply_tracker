import { useEffect, useState, useMemo } from 'react';
import { MapPin, CheckCircle, Navigation, Package, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_FLOW = {
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

const STATUS_NEXT_LABEL = {
  assigned: 'Mark Picked Up',
  picked_up: 'Mark In Transit',
  in_transit: 'Mark Delivered',
};

export default function MyDeliveries() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      setShipments(data);
    } catch {
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    setUpdatingId(shipmentId);
    try {
      await driverAPI.updateStatus(shipmentId, newStatus);
      toast.success('Status updated');
      fetchShipments();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = shipments;

    if (tab === 'active') {
      list = list.filter((s) => ['assigned', 'picked_up', 'in_transit'].includes(s.status));
    } else if (tab === 'delivered') {
      list = list.filter((s) => s.status === 'delivered');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.trackingNumber?.toLowerCase().includes(q) ||
          s.from?.toLowerCase().includes(q) ||
          s.to?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [shipments, tab, search]);

  const counts = useMemo(
    () => ({
      active: shipments.filter((s) => ['assigned', 'picked_up', 'in_transit'].includes(s.status)).length,
      all: shipments.length,
      delivered: shipments.filter((s) => s.status === 'delivered').length,
    }),
    [shipments]
  );

  if (loading) {
    return (
      <DashboardLayout title="My Deliveries">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Deliveries">

      {/* Tab bar + search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Tabs */}
        <div className="flex border border-brand-zinc-200 rounded-sm overflow-hidden divide-x divide-brand-zinc-200 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-black text-white'
                  : 'bg-white text-brand-zinc-500 hover:bg-brand-zinc-50 hover:text-black'
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-brand-zinc-100 text-brand-zinc-500'
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by tracking number or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-brand-zinc-100 rounded-sm flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-brand-zinc-400" />
            </div>
            <p className="font-bold text-black mb-1">
              {tab === 'active' ? 'No active deliveries' : 'Nothing here'}
            </p>
            <p className="text-sm text-brand-zinc-500">
              {tab === 'active'
                ? 'Your admin will assign jobs to you soon.'
                : 'Try changing the filter above.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((shipment) => (
            <DeliveryCard
              key={shipment._id}
              shipment={shipment}
              updating={updatingId === shipment._id}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function DeliveryCard({ shipment, updating, onStatusUpdate }) {
  const nextStatus = STATUS_FLOW[shipment.status];
  const isDelivered = shipment.status === 'delivered';

  return (
    <div className={`bg-white border rounded-sm overflow-hidden ${isDelivered ? 'border-brand-zinc-200 opacity-80' : 'border-brand-zinc-200 hover:border-black'} transition-colors`}>
      {/* Top strip — status colour accent */}
      <div
        className={`h-0.5 w-full ${
          shipment.status === 'in_transit'
            ? 'bg-purple-500'
            : shipment.status === 'picked_up'
            ? 'bg-cyan-500'
            : shipment.status === 'delivered'
            ? 'bg-green-500'
            : 'bg-blue-500'
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-mono text-xs text-brand-zinc-500 mb-1">{shipment.trackingNumber}</p>
            <StatusBadge status={shipment.status} />
          </div>
          <div className="text-right shrink-0">
            {shipment.distance ? (
              <p className="text-sm font-bold text-black">{shipment.distance.toFixed(1)} km</p>
            ) : null}
            {shipment.currentETA ? (
              <p className="text-xs text-brand-zinc-500">{Math.round(shipment.currentETA)} min left</p>
            ) : null}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-stretch gap-3 mb-4">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <div className="w-px flex-1 bg-brand-zinc-200" />
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          </div>
          <div className="flex flex-col justify-between min-h-[48px] min-w-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-zinc-400">From</p>
              <p className="text-sm font-medium text-black truncate">{shipment.from}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-zinc-400">To</p>
              <p className="text-sm font-medium text-black truncate">{shipment.to}</p>
            </div>
          </div>
        </div>

        {/* Customer info if available */}
        {shipment.createdBy?.displayName && (
          <p className="text-xs text-brand-zinc-500 mb-4">
            Order by <span className="text-black font-medium">{shipment.createdBy.displayName}</span>
          </p>
        )}

        {/* Actions */}
        {isDelivered ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
            <CheckCircle size={16} />
            Delivered
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to={`/driver/navigate/${shipment._id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full" icon={Navigation}>
                Navigate
              </Button>
            </Link>
            {nextStatus && (
              <Button
                size="sm"
                className="flex-1"
                loading={updating}
                onClick={() => onStatusUpdate(shipment._id, nextStatus)}
              >
                {STATUS_NEXT_LABEL[shipment.status]}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}