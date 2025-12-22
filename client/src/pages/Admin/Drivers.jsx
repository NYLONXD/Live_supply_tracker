// ===== Drivers.jsx =====
import { useEffect, useState } from 'react';
import { Search, Truck, UserMinus } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await adminAPI.getAllDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async (userId) => {
    if (!confirm('Demote this driver to user?')) return;
    try {
      await adminAPI.demoteDriver(userId);
      toast.success('Driver demoted');
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote driver');
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Drivers">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Drivers Management">
      <Card className="mb-6">
        <Input
          icon={Search}
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="mt-4 text-sm text-slate-400">{filteredDrivers.length} drivers</div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <Card key={driver._id} hover>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Truck className="text-purple-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{driver.displayName}</h3>
                <p className="text-sm text-slate-400 mb-2">{driver.email}</p>
                {driver.vehicleInfo && (
                  <p className="text-xs text-slate-500">Vehicle: {driver.vehicleInfo}</p>
                )}
                {driver.vehicleNumber && (
                  <p className="text-xs text-slate-500">Number: {driver.vehicleNumber}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Button
                size="sm"
                variant="danger"
                className="w-full"
                onClick={() => handleDemote(driver._id)}
              >
                <UserMinus size={16} className="mr-1" />
                Demote to User
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Drivers;