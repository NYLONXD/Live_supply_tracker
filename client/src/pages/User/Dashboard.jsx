// client/src/pages/User/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, TrendingUp, Plus, ArrowRight, MapPin, Hexagon, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card, { StatCard } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { shipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0 });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await shipmentAPI.getAll();
      setStats({
        total: data.length,
        pending: data.filter(s => s.status === 'pending').length,
        inTransit: data.filter(s => ['assigned', 'picked_up', 'in_transit'].includes(s.status)).length,
        delivered: data.filter(s => s.status === 'delivered').length,
      });
      setRecentShipments(data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Consumer Overview">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin shadow-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Consumer Overview">
      
      {/* Welcome Banner */}
      <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-8 mb-10 shadow-xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black mb-1">Global Delivery Network</h2>
              <p className="text-sm font-medium text-zinc-500">Track and manage your shipments with premium precision.</p>
            </div>
          </div>
          
          <Link to="/user/create">
            <Button className="h-12 px-8 text-sm font-bold shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all rounded-xl w-full md:w-auto">
              Initialize Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Premium Light Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <PremiumStatCard icon={Package} label="Total Shipments" value={stats.total} />
        <PremiumStatCard icon={Clock} label="Pending Review" value={stats.pending} />
        <PremiumStatCard icon={TrendingUp} label="In Transit" value={stats.inTransit} active />
        <PremiumStatCard icon={CheckCircle} label="Successfully Delivered" value={stats.delivered} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-black flex items-center gap-2">
              <Clock size={18} className="text-zinc-400" />
              Recent Logistics
            </h2>
            <Link to="/user/shipments">
              <span className="text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-wider transition-colors flex items-center gap-1">
                View Archive <ArrowRight size={14} />
              </span>
            </Link>
          </div>

          {recentShipments.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-3xl p-12 text-center shadow-sm animate-modern-fade">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-zinc-200/50">
                <Package size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">No active logistics</h3>
              <p className="text-zinc-500 text-sm mb-8">Deploy your first shipment to initiate tracking procedures.</p>
              <Link to="/user/create">
                <Button variant="outline" className="h-11 px-6 rounded-xl border-zinc-200 hover:border-black hover:bg-zinc-50">
                  Create Shipment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl overflow-hidden shadow-xl animate-modern-fade">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tracking Number</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Route</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentShipments.map((shipment) => (
                    <tr key={shipment._id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="py-5 px-6">
                        <span className="font-mono text-xs font-semibold text-black bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200 group-hover:bg-zinc-200 transition-colors">
                          {shipment.trackingNumber}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-black truncate max-w-[100px]">{shipment.from?.split(',')[0]}</span>
                          <ArrowRight size={12} className="text-zinc-400" />
                          <span className="text-xs font-bold text-black truncate max-w-[100px]">{shipment.to?.split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="py-5 px-6">
                        <Link to={`/user/track/${shipment._id}`}>
                          <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">
                            Track
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <div className="bg-black rounded-3xl p-8 relative overflow-hidden shadow-2xl group hover:shadow-[0_0_40px_rgba(0,0,0,0.15)] transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
              <Hexagon size={24} className="text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Premium Support</h3>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Experience seamless logistics with our dedicated 24/7 consumer concierge service.
            </p>
            
            <Link to="/support">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                Contact Support
              </Button>
            </Link>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 shadow-xl">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Links</h3>
             <div className="space-y-2">
                <QuickLink to="/user/shipments" label="Logistics Archive" icon={Package} />
                <QuickLink to="/user/create" label="Deploy Shipment" icon={Plus} />
                <QuickLink to="/support" label="Help Center" icon={ShieldCheck} />
             </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function PremiumStatCard({ icon: Icon, label, value, active }) {
  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
      active 
        ? 'bg-black border-black shadow-2xl' 
        : 'bg-white/80 backdrop-blur-xl border-zinc-200/50 hover:border-zinc-300 shadow-xl'
    }`}>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-2xl ${active ? 'bg-white/10 text-white border border-white/10' : 'bg-zinc-100 text-zinc-500 border border-zinc-200/50 group-hover:bg-zinc-200 transition-colors'}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <div className={`text-4xl font-black tracking-tighter mb-2 relative z-10 ${active ? 'text-white' : 'text-black'}`}>
        {value}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-widest relative z-10 ${active ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {label}
      </div>
    </div>
  );
}

function QuickLink({ to, label, icon: Icon }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/50 flex items-center justify-center group-hover:bg-white group-hover:border-zinc-300 transition-all shadow-sm">
        <Icon size={14} className="text-zinc-600 group-hover:text-black" />
      </div>
      <span className="text-xs font-bold text-zinc-600 group-hover:text-black transition-colors">{label}</span>
      <ArrowRight size={14} className="ml-auto text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
    </Link>
  );
}