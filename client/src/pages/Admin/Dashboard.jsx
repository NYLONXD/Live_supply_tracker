// client/src/pages/Admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Truck, ArrowUpRight, ShieldCheck, Zap, Activity, Clock, MapPin, TrendingUp } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { analyticsAPI, shipmentAPI, adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalShipments: 0, averageETA: 0 });
  const [allShipments, setAllShipments] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, drivers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, shipmentsRes, usersRes, driversRes] = await Promise.all([
        analyticsAPI.getOverview(),
        shipmentAPI.getAll(),
        adminAPI.getAllUsers(),
        adminAPI.getAllDrivers(),
      ]);
      setStats(analyticsRes.data);
      setAllShipments(shipmentsRes.data);
      setRecentShipments(shipmentsRes.data.slice(0, 8));
      setUserStats({ total: usersRes.data.length, drivers: driversRes.data.length });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="System Overview">
      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Global Shipments" value={stats.totalShipments} icon={Package} trend="+12.4%" />
        <MetricCard label="Active Personnel" value={userStats.total} icon={Users} />
        <MetricCard label="Verified Fleet" value={userStats.drivers} icon={Truck} active />
        <MetricCard label="Precision ETA" value={formatETA(stats.averageETA)} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between p-4 glass-dark rounded-t-xl border-b-0 border-white/10">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green shadow-[0_0_8px_#00ff66]"></span>
              </span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white">Live Operations Manifest</h2>
            </div>
            <Link to="/admin/shipments" className="text-[10px] font-bold tracking-widest uppercase text-neon-blue hover:text-white transition-colors">
              VIEW FULL LOGS
            </Link>
          </div>

          <div className="glass-dark border border-white/10 rounded-b-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hash ID</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trajectory</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operator</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentShipments.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs text-muted-foreground group-hover:text-neon-blue transition-colors">{s.trackingNumber.slice(-8).toUpperCase()}</td>
                    <td className="py-4 px-6 text-xs text-white font-medium">
                      {s.from.split(',')[0]} <span className="text-muted-foreground mx-1">→</span> {s.to.split(',')[0]}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground group-hover:text-white transition-colors">
                      {s.assignedDriver?.displayName || 'UNASSIGNED'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/40 border border-white/10 shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'in_transit' ? 'bg-neon-blue shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse' : 
                          s.status === 'pending' ? 'bg-amber-400' : 'bg-muted-foreground'
                        }`} />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="space-y-6">
           <div className="glass-dark border border-neon-blue/30 p-6 rounded-xl relative overflow-hidden group hover:border-neon-blue transition-colors">
              <div className="absolute -right-10 -top-10 p-2 opacity-5 text-neon-blue group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                <ShieldCheck size={140} />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-[50px]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 relative z-10">Core Telemetry</h3>
              <div className="space-y-4 relative z-10">
                 <SystemMetric label="API LATENCY" value="42ms" color="text-neon-green" />
                 <SystemMetric label="AI PREDICTION" value="ACTIVE" color="text-neon-blue" />
                 <SystemMetric label="NODES ONLINE" value="12 / 12" />
              </div>
           </div>
           
           <div className="glass-dark border border-white/10 p-6 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Quick Directives</h3>
              <div className="grid grid-cols-1 gap-2">
                 <AdminAction to="/admin/shipments/create" label="Deploy New Shipment" />
                 <AdminAction to="/admin/drivers" label="Fleet Management" />
                 <AdminAction to="/support" label="Support Center" />
              </div>
           </div>
        </div>
      </div>

      {/* ── Bottom Section: Activity Timeline + Status Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <ActivityTimeline shipments={allShipments} />
        </div>
        <div>
          <StatusDistribution shipments={allShipments} />
        </div>
      </div>

    </DashboardLayout>
  );
}

/* ── Activity Timeline ──────────────────────────────────────── */
function ActivityTimeline({ shipments }) {
  const events = shipments
    .slice(0, 12)
    .map((s) => {
      const evtMap = {
        delivered:  { verb: 'was delivered',     icon: Package, color: 'bg-neon-green', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.6)]' },
        in_transit: { verb: 'is now in transit', icon: Truck,   color: 'bg-neon-blue',  glow: 'shadow-[0_0_10px_rgba(0,240,255,0.6)]' },
        assigned:   { verb: 'was assigned',      icon: Users,   color: 'bg-neon-purple', glow: 'shadow-[0_0_10px_rgba(180,0,255,0.6)]' },
        picked_up:  { verb: 'was picked up',     icon: MapPin,  color: 'bg-amber-400',   glow: 'shadow-[0_0_10px_rgba(251,191,36,0.6)]' },
        pending:    { verb: 'is awaiting assignment', icon: Clock, color: 'bg-zinc-500', glow: '' },
      };
      const evt = evtMap[s.status] || evtMap.pending;
      return { ...evt, shipment: s, time: s.updatedAt || s.createdAt };
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8);

  const timeAgo = (dateStr) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.2s' }}>
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
          <Activity size={16} className="text-neon-blue" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Activity Stream</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Recent network events</p>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-neon-blue/40 via-white/10 to-transparent" />

          <div className="space-y-6">
            {events.map((evt, i) => {
              const Icon = evt.icon;
              return (
                <div key={i} className="flex gap-4 group">
                  <div className={`relative z-10 w-[23px] h-[23px] rounded-full ${evt.color} ${evt.glow} flex items-center justify-center shrink-0 mt-0.5 border-2 border-[#121212]`}>
                    <Icon size={10} className="text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium leading-snug">
                      <span className="font-mono text-neon-blue">{evt.shipment.trackingNumber.slice(-6).toUpperCase()}</span>
                      <span className="text-muted-foreground"> {evt.verb}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {evt.shipment.from?.split(',')[0]} → {evt.shipment.to?.split(',')[0]}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 mt-1">{timeAgo(evt.time)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {events.length === 0 && (
          <div className="text-center py-8">
            <Activity size={28} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-xs text-muted-foreground">No recent activity to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status Distribution (visual bar chart) ─────────────────── */
function StatusDistribution({ shipments }) {
  const STATUS_CONFIG = {
    pending:    { label: 'Pending',    color: 'bg-amber-400',   textColor: 'text-amber-400' },
    assigned:   { label: 'Assigned',   color: 'bg-neon-purple', textColor: 'text-neon-purple' },
    picked_up:  { label: 'Picked Up',  color: 'bg-neon-pink',   textColor: 'text-neon-pink' },
    in_transit: { label: 'In Transit', color: 'bg-neon-blue',   textColor: 'text-neon-blue' },
    delivered:  { label: 'Delivered',  color: 'bg-neon-green',  textColor: 'text-neon-green' },
    cancelled:  { label: 'Cancelled',  color: 'bg-destructive', textColor: 'text-destructive' },
  };

  const counts = {};
  shipments.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
  const total = shipments.length || 1;
  const maxCount = Math.max(...Object.values(counts), 1);

  const entries = Object.entries(STATUS_CONFIG).filter(([key]) => counts[key] > 0);

  return (
    <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-full animate-modern-fade" style={{ animationDelay: '0.3s' }}>
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
          <TrendingUp size={16} className="text-neon-green" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Status Matrix</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Shipment distribution</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {entries.map(([key, cfg]) => {
          const count = counts[key];
          const pct = Math.round((count / total) * 100);
          const barWidth = Math.max(8, (count / maxCount) * 100);
          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.textColor}`}>{cfg.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{count}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">({pct}%)</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full ${cfg.color} rounded-full transition-all duration-700 ease-out group-hover:opacity-100 opacity-80`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp size={28} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-xs text-muted-foreground">No shipment data yet.</p>
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Processed</span>
          <span className="text-lg font-black text-white tracking-tighter">{shipments.length}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function MetricCard({ label, value, icon: Icon, trend, active }) {
  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
      active 
        ? 'bg-primary border-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
        : 'glass-dark border-white/10 hover:border-white/30'
    }`}>
      {active && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-lg ${active ? 'bg-background text-foreground' : 'bg-white/5 text-muted-foreground group-hover:text-white transition-colors'}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-md border border-neon-green/20">
            {trend}
          </span>
        )}
      </div>
      <div className={`text-4xl font-extrabold tracking-tighter mb-1 relative z-10 ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
        {value}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] relative z-10 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
        {label}
      </div>
    </div>
  );
}

function SystemMetric({ label, value, color = "text-white" }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
        <Activity size={12} className="text-zinc-600" />
        {label}
      </span>
      <span className={`font-mono text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

function AdminAction({ to, label }) {
  return (
    <Link to={to} className="flex items-center justify-between p-3 border border-white/5 rounded-lg hover:bg-white/5 transition-all group overflow-hidden relative">
      <div className="absolute inset-0 w-0 bg-white/5 group-hover:w-full transition-all duration-300 ease-out" />
      <span className="text-xs font-bold uppercase tracking-widest relative z-10 text-muted-foreground group-hover:text-white transition-colors">{label}</span>
      <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-neon-blue relative z-10 transition-colors" />
    </Link>
  );
}