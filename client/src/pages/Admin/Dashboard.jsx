import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Truck, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { analyticsAPI, shipmentAPI, adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalShipments: 0,
    averageETA: 0,
    topRoute: 'N/A',
  });
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
      setRecentShipments(shipmentsRes.data.slice(0, 10));
      setUserStats({
        total: usersRes.data.length,
        drivers: driversRes.data.length,
      });
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
      value: stats.totalShipments,
      color: 'purple',
      link: '/admin/shipments',
    },
    {
      icon: Users,
      label: 'Total Users',
      value: userStats.total,
      color: 'blue',
      link: '/admin/users',
    },
    {
      icon: Truck,
      label: 'Active Drivers',
      value: userStats.drivers,
      color: 'green',
      link: '/admin/drivers',
    },
    {
      icon: Clock,
      label: 'Avg ETA',
      value: `${stats.averageETA.toFixed(1)}h`,
      color: 'yellow',
      link: '/admin/analytics',
    },
  ];

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      assigned: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      picked_up: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
      in_transit: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      delivered: { bg: 'bg-green-500/10', text: 'text-green-400' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400' },
    };

    const style = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card hover gradient className="cursor-pointer relative overflow-hidden">
              <div className={`absolute inset-0 bg-${stat.color}-500/10 opacity-50`} />
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
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Delivered Today</p>
              <p className="text-2xl font-bold text-white">
                {recentShipments.filter(s => s.status === 'delivered').length}
              </p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">In Transit</p>
              <p className="text-2xl font-bold text-white">
                {recentShipments.filter(s => s.status === 'in_transit').length}
              </p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <AlertCircle className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending Assignment</p>
              <p className="text-2xl font-bold text-white">
                {recentShipments.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Shipments</h2>
          <Link to="/admin/shipments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Tracking #</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Route</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Driver</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">ETA</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment) => (
                  <tr
                    key={shipment._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-sm text-purple-400">
                      {shipment.trackingNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {shipment.from} → {shipment.to}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(shipment.status)}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {shipment.assignedDriver?.displayName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}