// client/src/pages/User/Dashboard.jsx - MODERNIZED

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, TrendingUp, Plus, ArrowRight, MapPin } from 'lucide-react';
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
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Total Shipments" value={stats.total} variant="default" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} variant="default" />
        <StatCard icon={TrendingUp} label="In Transit" value={stats.inTransit} variant="dark" />
        <StatCard icon={CheckCircle} label="Delivered" value={stats.delivered} trend="+12%" variant="default" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/user/create">
            <Card hover className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black text-white rounded-sm group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight mb-1">Create New Shipment</h3>
                    <p className="text-xs text-brand-zinc-500">Start tracking a new package</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-brand-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>

          <Link to="/user/shipments">
            <Card hover className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-zinc-100 rounded-sm group-hover:scale-110 transition-transform">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight mb-1">View All Shipments</h3>
                    <p className="text-xs text-brand-zinc-500">Manage your packages</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-brand-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
          <Link to="/user/shipments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {recentShipments.length === 0 ? (
          <Card variant="elevated">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-brand-zinc-100 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-brand-zinc-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">No shipments yet</h3>
              <p className="text-brand-zinc-500 text-sm mb-6">Create your first shipment to get started</p>
              <Link to="/user/create">
                <Button icon={Plus}>Create Shipment</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-brand-zinc-200 bg-brand-zinc-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase text-brand-zinc-500 tracking-wider">Tracking #</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase text-brand-zinc-500 tracking-wider">Route</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase text-brand-zinc-500 tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase text-brand-zinc-500 tracking-wider">ETA</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase text-brand-zinc-500 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-zinc-100">
                  {recentShipments.map((shipment) => (
                    <tr key={shipment._id} className="hover:bg-brand-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium">{shipment.trackingNumber}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={12} className="text-brand-zinc-400" />
                          <span className="text-brand-zinc-600">
                            {shipment.from?.split(',')[0]} → {shipment.to?.split(',')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={shipment.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-brand-zinc-600 font-medium text-xs">
                        {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/user/track/${shipment._id}`}>
                          <Button variant="ghost" size="sm">Track</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

    </DashboardLayout>
  );
}