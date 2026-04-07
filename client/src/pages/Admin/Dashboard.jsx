// client/src/pages/Admin/Dashboard.jsx - ENHANCED
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Truck, Activity, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
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
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="System Overview">
      <style>{`
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-live { animation: subtlePulse 2s infinite; }
      `}</style>

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
          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-t-lg">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-widest uppercase text-white">Live Operations Manifest</h2>
            </div>
            <Link to="/admin/shipments" className="text-[10px] font-black tracking-tighter text-zinc-500 hover:text-white transition-colors">
              VIEW FULL LOGS
            </Link>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-b-lg overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hash ID</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trajectory</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operator</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentShipments.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs text-zinc-400">{s.trackingNumber.slice(-8).toUpperCase()}</td>
                    <td className="py-4 px-6 text-xs text-white font-medium">
                      {s.from.split(',')[0]} <span className="text-zinc-600">→</span> {s.to.split(',')[0]}
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-400 group-hover:text-white transition-colors">
                      {s.assignedDriver?.displayName || 'UNASSIGNED'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-sm bg-zinc-800/50 border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'in_transit' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse' : 
                          s.status === 'pending' ? 'bg-amber-500' : 'bg-zinc-500'
                        }`} />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">
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
           <div className="bg-white border-2 border-black p-6 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <ShieldCheck size={80} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Core Telemetry</h3>
              <div className="space-y-4 relative z-10">
                 <SystemMetric label="API LATENCY" value="42ms" color="text-emerald-600" />
                 <SystemMetric label="AI PREDICTION" value="ACTIVE" color="text-emerald-600" />
                 <SystemMetric label="NODES ONLINE" value="12 / 12" />
              </div>
           </div>
           
           <div className="border border-white/10 bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Quick Directives</h3>
              <div className="grid grid-cols-1 gap-2">
                 <AdminAction to="/admin/shipments/create" label="Deploy New Shipment" />
                 <AdminAction to="/admin/drivers" label="Fleet Management" />
                 <AdminAction to="/admin/analytics" label="Intelligence Reports" />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, icon: Icon, trend, active }) {
  return (
    <div className={`p-6 rounded-lg border transition-all duration-300 ${
      active 
        ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
        : 'bg-zinc-900 border-white/5 hover:border-white/20'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-sm ${active ? 'bg-zinc-100' : 'bg-white/5'}`}>
          <Icon size={18} className={active ? 'text-black' : 'text-zinc-400'} />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className={`text-4xl font-bold tracking-tighter mb-1 ${active ? 'text-black' : 'text-white'}`}>
        {value}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? 'text-zinc-500' : 'text-zinc-500'}`}>
        {label}
      </div>
    </div>
  );
}

function SystemMetric({ label, value, color = "text-black" }) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
      <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">{label}</span>
      <span className={`font-mono text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

function AdminAction({ to, label }) {
  return (
    <Link to={to} className="flex items-center justify-between p-3 border border-white/5 rounded-sm hover:bg-white hover:text-black transition-all group">
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
      <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-black" />
    </Link>
  );
}