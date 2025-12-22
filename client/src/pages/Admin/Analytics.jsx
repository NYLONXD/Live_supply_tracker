import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { analyticsAPI } from '../../services/api';

export function Analytics() {
  const [overview, setOverview] = useState(null);
  const [perDay, setPerDay] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, perDayRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getPerDay(),
      ]);
      setOverview(overviewRes.data);
      setPerDay(perDayRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics & Insights">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Package className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Shipments</p>
              <p className="text-2xl font-bold text-white">{overview?.totalShipments || 0}</p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Avg ETA</p>
              <p className="text-2xl font-bold text-white">
                {overview?.averageETA.toFixed(1) || 0}h
              </p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Top Route</p>
              <p className="text-lg font-bold text-white">{overview?.topRoute || 'N/A'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipments Per Day */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Shipments Per Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={perDay}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Routes Pie */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Top Routes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overview?.topRoutes || []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(overview?.topRoutes || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Analytics;