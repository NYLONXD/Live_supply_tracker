import { useEffect, useState } from 'react';
import { Package, MapPin, CheckCircle, Navigation, Clock, ChevronRight, Truck, AlertCircle, TrendingUp, Zap, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatETA } from '../../utils/formatTime';
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
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Derived performance data ──
  const totalKm = shipments.reduce((sum, s) => sum + (s.distance || 0), 0);
  const avgDeliveryTime = delivered.length > 0
    ? delivered.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0) / delivered.length
    : 0;

  return (
    <DashboardLayout title="Dashboard">

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Welcome back</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">{firstName}</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard icon={Package} label="Assigned" value={active.filter((s) => s.status === 'assigned').length} />
        <StatCard icon={Truck} label="In Transit" value={active.filter((s) => s.status !== 'assigned').length} active />
        <StatCard icon={CheckCircle} label="Delivered" value={delivered.length} />
      </div>

      {/* Primary active job */}
      {primaryJob ? (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-blue flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
              </span>
              Active Mission
            </p>
          </div>

          <div className="relative glass-dark rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
            
            <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-2 opacity-80">{primaryJob.trackingNumber}</p>
                <StatusBadge status={primaryJob.status} />
              </div>
              <div className="text-right">
                {primaryJob.distance && (
                  <p className="text-2xl font-black text-white tracking-tighter">{primaryJob.distance.toFixed(1)} km</p>
                )}
                {primaryJob.currentETA && (
                  <p className="text-xs font-bold text-neon-green flex items-center gap-1 justify-end mt-1 uppercase tracking-widest">
                    <Clock size={12} /> {formatETA(primaryJob.currentETA)}
                  </p>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="space-y-4 mb-8 relative z-10 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full bg-neon-green shrink-0 shadow-[0_0_10px_rgba(0,255,102,0.5)]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Pickup</p>
                  <p className="text-sm font-bold text-white">{primaryJob.from}</p>
                </div>
              </div>
              <div className="ml-1.5 w-px h-6 bg-gradient-to-b from-neon-green to-neon-pink" />
              <div className="flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full bg-neon-pink shrink-0 shadow-[0_0_10px_rgba(255,0,60,0.5)]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Delivery</p>
                  <p className="text-sm font-bold text-white">{primaryJob.to}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <Link to={`/driver/navigate/${primaryJob._id}`} className="flex-1">
                <Button className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200" icon={Navigation}>
                  Navigate
                </Button>
              </Link>
              {STATUS_FLOW[primaryJob.status] && (
                <Button
                  variant="neon"
                  className="flex-1 h-14 text-lg font-bold"
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
        <div className="mb-10">
          <div className="glass-dark border border-white/10 rounded-2xl p-10 text-center animate-modern-fade">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <AlertCircle size={28} className="text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-white mb-2 tracking-tight">No active missions</p>
            <p className="text-sm text-muted-foreground">Your dispatcher will assign new routes shortly.</p>
          </div>
        </div>
      )}

      {/* Queue — remaining active jobs */}
      {active.length > 1 && (
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Upcoming Route ({active.length - 1})
          </p>
          <div className="space-y-3">
            {active.slice(1).map((s) => (
              <QueueCard key={s._id} shipment={s} />
            ))}
          </div>
        </div>
      )}

      {/* Link to all deliveries */}
      <Link to="/driver/deliveries" className="block mb-8">
        <div className="flex items-center justify-between p-5 glass-dark border border-white/10 rounded-xl hover:border-neon-blue transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-neon-blue/10 group-hover:text-neon-blue transition-colors">
              <Package size={20} className="text-muted-foreground group-hover:text-neon-blue" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white tracking-tight">Mission History</span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{shipments.length} total logs</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground group-hover:text-neon-blue transition-colors group-hover:translate-x-1" />
        </div>
      </Link>

      {/* ── Bottom Section: Performance Stats + Recent Deliveries ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Stats */}
        <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.2s' }}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center border border-neon-blue/20">
              <TrendingUp size={16} className="text-neon-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Performance</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Lifetime stats</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <PerfStat label="Total Distance" value={`${totalKm.toFixed(0)} km`} icon={Route} color="text-neon-green" />
            <PerfStat label="Deliveries Done" value={delivered.length} icon={CheckCircle} color="text-neon-blue" />
            <PerfStat label="Avg. Delivery Time" value={formatETA(avgDeliveryTime)} icon={Clock} color="text-amber-400" />
            <PerfStat label="Active Jobs" value={active.length} icon={Zap} color="text-neon-pink" />
            {/* Completion rate */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion Rate</span>
                <span className="text-xs font-black text-neon-green">
                  {shipments.length > 0 ? Math.round((delivered.length / shipments.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-neon-green rounded-full transition-all duration-700 opacity-80"
                  style={{ width: `${shipments.length > 0 ? (delivered.length / shipments.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Delivery Timeline */}
        <div className="lg:col-span-2 glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.3s' }}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
              <Clock size={16} className="text-neon-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Recent Deliveries</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Completed missions</p>
            </div>
          </div>

          <div className="p-6">
            {delivered.length === 0 ? (
              <div className="text-center py-10">
                <Package size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">No deliveries yet</p>
                <p className="text-xs text-muted-foreground">Completed missions will appear here.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-neon-green/40 via-white/10 to-transparent" />
                <div className="space-y-5">
                  {delivered.slice(0, 6).map((s, i) => {
                    const timeAgo = (() => {
                      const diff = Math.max(0, Date.now() - new Date(s.updatedAt || s.createdAt).getTime());
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return 'Just now';
                      if (mins < 60) return `${mins}m ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })();
                    return (
                      <div key={s._id} className="flex gap-4 group">
                        <div className="relative z-10 w-[23px] h-[23px] rounded-full bg-neon-green shadow-[0_0_10px_rgba(0,255,102,0.6)] flex items-center justify-center shrink-0 mt-0.5 border-2 border-[#121212]">
                          <CheckCircle size={10} className="text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium leading-snug">
                            <span className="font-mono text-neon-blue">{s.trackingNumber.slice(-6).toUpperCase()}</span>
                            <span className="text-muted-foreground"> delivered</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {s.from?.split(',')[0]} → {s.to?.split(',')[0]}
                          </p>
                          {s.distance && (
                            <p className="text-[9px] font-bold text-neon-green/70 mt-0.5 uppercase tracking-widest">{s.distance.toFixed(1)} km</p>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 mt-1">{timeAgo}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, active }) {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
      active 
        ? 'bg-primary border-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
        : 'glass-dark border-white/10'
    }`}>
      {active && <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-transparent opacity-50" />}
      <div className={`p-2.5 rounded-lg inline-block mb-3 ${active ? 'bg-background' : 'bg-white/5'}`}>
        <Icon size={18} className={active ? 'text-foreground' : 'text-muted-foreground'} />
      </div>
      <p className={`text-3xl font-black tracking-tighter mb-1 relative z-10 ${active ? 'text-primary-foreground' : 'text-white'}`}>{value}</p>
      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] relative z-10 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{label}</p>
    </div>
  );
}

function QueueCard({ shipment }) {
  return (
    <Link to={`/driver/navigate/${shipment._id}`}>
      <div className="flex items-center justify-between p-4 glass-dark border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all group cursor-pointer">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-2 bg-white/5 rounded-full shrink-0 group-hover:bg-white/10 transition-colors">
            <MapPin size={16} className="text-muted-foreground group-hover:text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-0.5">{shipment.trackingNumber}</p>
            <p className="text-xs font-bold text-white truncate">
              {shipment.from?.split(',')[0]} <span className="text-muted-foreground mx-1">→</span> {shipment.to?.split(',')[0]}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-white transition-colors shrink-0 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function PerfStat({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
          <Icon size={14} className={color} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}