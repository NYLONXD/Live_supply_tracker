// client/src/pages/Driver/MyDeliveries.jsx
import { useEffect, useState, useMemo } from 'react';
import { MapPin, CheckCircle, Navigation, Package, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatETA } from '../../utils/formatTime';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'active', label: 'Active Missions' },
  { key: 'all', label: 'All Logs' },
  { key: 'delivered', label: 'Completed' },
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
      <DashboardLayout title="Mission Logs">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mission Logs">

      {/* Tab bar + search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Tabs */}
        <div className="flex p-1 bg-black/50 border border-white/10 rounded-lg shrink-0 overflow-x-auto custom-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md flex items-center gap-2 whitespace-nowrap ${
                tab === t.key
                  ? 'bg-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  tab === t.key ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue' : 'bg-white/5 border-white/10 text-muted-foreground'
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1">
          <div className="relative h-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full h-full min-h-[44px] pl-10 pr-4 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
              placeholder="Search by tracking hash or coordinates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-dark border border-white/10 rounded-2xl p-16 text-center animate-modern-fade">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            <Package size={32} className="text-muted-foreground opacity-50" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white mb-2">
            {tab === 'active' ? 'No Active Missions' : 'Zero Results'}
          </p>
          <p className="text-xs text-muted-foreground">
            {tab === 'active'
              ? 'Stand by for new dispatch coordinates.'
              : 'Adjust your search parameters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-modern-fade" style={{ animationDelay: '0.1s' }}>
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
    <div className={`glass-dark border rounded-xl overflow-hidden relative group transition-all duration-300 ${isDelivered ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]'}`}>
      
      {/* Background glow for active */}
      {!isDelivered && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-neon-blue/10 transition-colors" />
      )}

      {/* Top strip — status colour accent */}
      <div
        className={`h-1 w-full ${
          shipment.status === 'in_transit'
            ? 'bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)] animate-pulse'
            : shipment.status === 'picked_up'
            ? 'bg-neon-purple shadow-[0_0_10px_rgba(180,0,255,0.8)]'
            : shipment.status === 'delivered'
            ? 'bg-neon-green/50'
            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
        }`}
      />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-xs text-muted-foreground mb-2 tracking-widest">{shipment.trackingNumber}</p>
            <StatusBadge status={shipment.status} />
          </div>
          <div className="text-right shrink-0">
            {shipment.distance ? (
              <p className="text-xl font-black tracking-tighter text-white">{shipment.distance.toFixed(1)} <span className="text-xs text-muted-foreground font-bold uppercase">km</span></p>
            ) : null}
            {shipment.currentETA ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mt-1">ETA: {formatETA(shipment.currentETA)}</p>
            ) : null}
          </div>
        </div>

        {/* Route */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-lg mb-6">
          <div className="flex items-stretch gap-4">
            <div className="flex flex-col items-center gap-1 pt-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-green shrink-0 shadow-[0_0_8px_rgba(0,255,102,0.5)]" />
              <div className="w-px flex-1 bg-gradient-to-b from-neon-green to-neon-pink opacity-50" />
              <div className="w-2.5 h-2.5 rounded-full bg-neon-pink shrink-0 shadow-[0_0_8px_rgba(255,0,102,0.5)]" />
            </div>
            <div className="flex flex-col justify-between min-h-[60px] min-w-0 py-0.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Pickup</p>
                <p className="text-xs font-bold text-white truncate">{shipment.from}</p>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Delivery</p>
                <p className="text-xs font-bold text-white truncate">{shipment.to}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer info if available */}
        {shipment.createdBy?.displayName && (
          <div className="flex items-center gap-2 mb-6 p-2 bg-white/5 rounded-md border border-white/5">
            <Package size={14} className="text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Client: <span className="text-white">{shipment.createdBy.displayName}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        {isDelivered ? (
          <div className="flex items-center justify-center gap-2 text-neon-green text-[10px] font-bold uppercase tracking-widest py-3 bg-neon-green/10 border border-neon-green/20 rounded-lg">
            <CheckCircle size={14} />
            Mission Accomplished
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to={`/driver/navigate/${shipment._id}`} className="flex-1">
              <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest h-11 border-white/20 text-white hover:border-neon-blue hover:text-neon-blue" icon={Navigation}>
                Navigate
              </Button>
            </Link>
            {nextStatus && (
              <Button
                variant="neon"
                className="flex-1 text-[10px] font-bold uppercase tracking-widest h-11"
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