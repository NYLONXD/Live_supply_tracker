import { useEffect, useState } from 'react';
import { Search, Trash2, UserPlus, Eye } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { shipmentAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AllShipments() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningDriver, setAssigningDriver] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [searchTerm, statusFilter, shipments]);

  const fetchData = async () => {
    try {
      const [shipmentsRes, driversRes] = await Promise.all([
        shipmentAPI.getAll(),
        adminAPI.getAllDrivers(),
      ]);
      setShipments(shipmentsRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterShipments = () => {
    let filtered = [...shipments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.to?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredShipments(filtered);
  };

  const handleAssignDriver = async (shipmentId) => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    try {
      await adminAPI.assignDriver(shipmentId, selectedDriver);
      toast.success('Driver assigned successfully');
      setAssigningDriver(null);
      setSelectedDriver('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;

    try {
      await shipmentAPI.delete(id);
      toast.success('Shipment deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete shipment');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
      assigned: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      picked_up: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      in_transit: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      delivered: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    };

    const style = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="All Shipments">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="All Shipments">
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
          Showing {filteredShipments.length} of {shipments.length} shipments
        </div>
      </Card>

      {/* Shipments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Tracking #</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Route</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Customer</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Driver</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr
                  key={shipment._id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-sm text-purple-400">
                    {shipment.trackingNumber}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    <div>
                      <div className="text-slate-400 text-xs">From: {shipment.from}</div>
                      <div className="text-slate-400 text-xs">To: {shipment.to}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {shipment.createdBy?.displayName || 'N/A'}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(shipment.status)}</td>
                  <td className="py-3 px-4">
                    {assigningDriver === shipment._id ? (
                      <div className="flex gap-2">
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-100"
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.displayName}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAssignDriver(shipment._id)}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAssigningDriver(null);
                            setSelectedDriver('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        {shipment.assignedDriver?.displayName || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {!shipment.assignedDriver && shipment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssigningDriver(shipment._id)}
                        >
                          <UserPlus size={16} />
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(shipment._id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}