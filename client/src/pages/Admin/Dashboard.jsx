// client/src/pages/Admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Truck, ArrowUpRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { analyticsAPI, shipmentAPI, adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalShipments: 0, averageETA: 0 });
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
        <MetricCard label="Precision ETA" value={`${stats.averageETA.toFixed(0)}m`} icon={Zap} />
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
    </DashboardLayout>
  );
}

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