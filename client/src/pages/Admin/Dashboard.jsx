import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Truck, Activity, ArrowUpRight } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { analyticsAPI, shipmentAPI, adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalShipments: 0, averageETA: 0 });
  const [recentShipments, setRecentShipments] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, drivers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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

  if (loading) return <DashboardLayout><div className="p-8 text-center text-zinc-500">Loading admin panel...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Command Center">
      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Shipments" value={stats.totalShipments} icon={Package} trend="+12%" />
        <MetricCard label="System Users" value={userStats.total} icon={Users} />
        <MetricCard label="Active Drivers" value={userStats.drivers} icon={Truck} active />
        <MetricCard label="Avg Response" value={`${stats.averageETA.toFixed(1)}h`} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight">Live Operations</h2>
            <Link to="/admin/shipments" className="text-xs font-bold border-b border-black pb-0.5 hover:opacity-50 transition-opacity">
              FULL MANIFEST
            </Link>
          </div>

          <div className="bg-white border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="py-3 px-4 font-bold text-xs uppercase text-zinc-500 tracking-wider">ID</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase text-zinc-500 tracking-wider">Route</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase text-zinc-500 tracking-wider">Driver</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase text-zinc-500 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentShipments.map((s) => (
                  <tr key={s._id} className="hover:bg-zinc-50/80">
                    <td className="py-3 px-4 font-mono text-xs">{s.trackingNumber.slice(-8)}</td>
                    <td className="py-3 px-4 text-xs font-medium">{s.from.split(',')[0]} → {s.to.split(',')[0]}</td>
                    <td className="py-3 px-4 text-xs text-zinc-500">{s.assignedDriver?.displayName || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                        s.status === 'in_transit' ? 'bg-green-500 animate-pulse' : 
                        s.status === 'pending' ? 'bg-yellow-500' : 'bg-zinc-300'
                      }`}></span>
                      <span className="text-xs uppercase font-bold tracking-wide">{s.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel / System Status */}
        <div className="space-y-6">
           <div className="bg-black text-white p-6 border border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">System Health</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm">API Latency</span>
                    <span className="font-mono text-green-400">45ms</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm">AI Prediction</span>
                    <span className="font-mono text-green-400">Online</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm">Active Nodes</span>
                    <span className="font-mono text-white">4/4</span>
                 </div>
              </div>
           </div>
           
           <div className="border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                 <QuickLink to="/admin/users" label="Users" />
                 <QuickLink to="/admin/drivers" label="Fleet" />
                 <QuickLink to="/admin/analytics" label="Reports" />
                 <QuickLink to="/settings" label="Config" />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, icon: Icon, trend, active }) {
  return (
    <div className={`p-6 border ${active ? 'bg-black text-white border-black' : 'bg-white border-zinc-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <Icon size={20} className={active ? 'text-zinc-400' : 'text-zinc-400'} />
        {trend && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm">{trend}</span>}
      </div>
      <div className="text-3xl font-bold tracking-tighter mb-1">{value}</div>
      <div className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</div>
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link to={to} className="flex items-center justify-between p-3 border border-zinc-100 hover:border-black hover:bg-zinc-50 transition-all group">
      <span className="text-xs font-bold">{label}</span>
      <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-black" />
    </Link>
  );
}