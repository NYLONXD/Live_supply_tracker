import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Trash2, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { shipmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [searchTerm, statusFilter, shipments]);

  const fetchShipments = async () => {
    try {
      const { data } = await shipmentAPI.getAll();
      setShipments(data);
      setFilteredShipments(data);
    } catch (error) {
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const filterShipments = () => {
    let filtered = [...shipments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Search filter
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;

    try {
      await shipmentAPI.delete(id);
      toast.success('Shipment deleted successfully');
      fetchShipments();
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
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="My Shipments">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Shipments">
      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search by tracking number or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
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
              <option value="cancelled">Cancelled</option>
            </select>

            <Button variant="outline">
              <Filter size={20} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-slate-400">Total: </span>
              <span className="text-white font-semibold">{shipments.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Filtered: </span>
              <span className="text-white font-semibold">{filteredShipments.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MapPin className="mx-auto mb-4 text-slate-600" size={48} />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No shipments found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new shipment</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredShipments.map((shipment) => (
            <Card key={shipment._id} hover className="cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-purple-400 font-semibold">
                      {shipment.trackingNumber}
                    </span>
                    {getStatusBadge(shipment.status)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-green-400" />
                      <span className="text-slate-300">From:</span>
                      <span className="text-slate-400">{shipment.from || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-red-400" />
                      <span className="text-slate-300">To:</span>
                      <span className="text-slate-400">{shipment.to || 'N/A'}</span>
                    </div>
                  </div>

                  {shipment.assignedDriver && (
                    <div className="mt-2 text-xs text-slate-500">
                      Driver: {shipment.assignedDriver.displayName}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/user/track/${shipment._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye size={16} className="mr-1" />
                      Track
                    </Button>
                  </Link>

                  {shipment.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(shipment._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Distance:</span>
                  <span className="text-white ml-2 font-medium">
                    {shipment.distance ? `${shipment.distance.toFixed(1)} km` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">ETA:</span>
                  <span className="text-white ml-2 font-medium">
                    {shipment.currentETA ? `${Math.round(shipment.currentETA)} min` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Created:</span>
                  <span className="text-white ml-2 font-medium">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Updated:</span>
                  <span className="text-white ml-2 font-medium">
                    {new Date(shipment.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}