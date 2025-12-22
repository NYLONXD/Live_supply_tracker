import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { shipmentAPI } from '../../services/api';

export default function UserDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await shipmentAPI.getAll();
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(s => s.status === 'pending').length,
        inTransit: data.filter(s => ['assigned', 'picked_up', 'in_transit'].includes(s.status)).length,
        delivered: data.filter(s => s.status === 'delivered').length,
      });

      // Get recent shipments
      setRecentShipments(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Package,
      label: 'Total Shipments',
      value: stats.total,
      color: 'purple',
      bgClass: 'from-purple-500/20 to-purple-600/20',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: stats.pending,
      color: 'yellow',
      bgClass: 'from-yellow-500/20 to-yellow-600/20',
    },
    {
      icon: TrendingUp,
      label: 'In Transit',
      value: stats.inTransit,
      color: 'blue',
      bgClass: 'from-blue-500/20 to-blue-600/20',
    },
    {
      icon: CheckCircle,
      label: 'Delivered',
      value: stats.delivered,
      color: 'green',
      bgClass: 'from-green-500/20 to-green-600/20',
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      picked_up: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      in_transit: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[status] || ''}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} gradient hover className="relative overflow-hidden">
            <div className={`absolute inset-0  ${stat.bgClass} opacity-50`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500/20 rounded-xl`}>
                  <stat.icon className={`text-${stat.color}-400`} size={24} />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/user/create">
            <Card hover className="cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Plus className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Create New Shipment</h3>
                  <p className="text-sm text-slate-400">Start tracking a new package</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/user/shipments">
            <Card hover className="cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Package className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">View All Shipments</h3>
                  <p className="text-sm text-slate-400">Manage your packages</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Shipments</h2>
          <Link to="/user/shipments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {recentShipments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-slate-600" size={48} />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No shipments yet</h3>
              <p className="text-slate-500 mb-6">Create your first shipment to get started</p>
              <Link to="/user/create">
                <Button>
                  <Plus size={20} className="mr-2" />
                  Create Shipment
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Tracking #</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">From → To</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">ETA</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((shipment) => (
                    <tr key={shipment._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-slate-300">{shipment.trackingNumber}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="text-sm">
                          <span className="text-slate-400">{shipment.from || 'N/A'}</span>
                          {' → '}
                          <span className="text-slate-400">{shipment.to || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(shipment.status)}</td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : 'N/A'}
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