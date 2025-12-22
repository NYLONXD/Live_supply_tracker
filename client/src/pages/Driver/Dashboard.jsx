import { useEffect, useState } from 'react';
import { Package, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { driverAPI } from '../../services/api';

export function DriverDashboard() {
  const [stats, setStats] = useState({ assigned: 0, inTransit: 0, completed: 0 });
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await driverAPI.getMyShipments();
      setShipments(data);
      setStats({
        assigned: data.filter((s) => s.status === 'assigned').length,
        inTransit: data.filter((s) => s.status === 'in_transit').length,
        completed: data.filter((s) => s.status === 'delivered').length,
      });
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Driver Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Driver Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Package className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Assigned</p>
              <p className="text-3xl font-bold text-white">{stats.assigned}</p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <MapPin className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">In Transit</p>
              <p className="text-3xl font-bold text-white">{stats.inTransit}</p>
            </div>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Clock className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Active Deliveries</h3>
        <div className="space-y-3">
          {shipments.slice(0, 5).map((shipment) => (
            <div
              key={shipment._id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm text-purple-400">{shipment.trackingNumber}</span>
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                  {shipment.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-1">To: {shipment.to}</p>
              <div className="flex gap-2 mt-3">
                <Link to={`/driver/navigate/${shipment._id}`} className="flex-1">
                  <Button size="sm" className="w-full">Start Navigation</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default DriverDashboard;