// client/src/pages/User/MyShipments.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Trash2, MapPin, Package, ArrowRight, Clock } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
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

  if (loading) {
    return (
      <DashboardLayout title="Logistics Archive">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin shadow-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Logistics Archive">
      
      {/* Filters Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search by tracking number or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/50 border border-zinc-200/50 rounded-xl text-sm text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors shadow-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none h-12 px-5 pr-10 bg-white/50 border border-zinc-200/50 rounded-xl text-sm font-bold text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-400">
                <Filter size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-zinc-100/50 relative z-10 flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <div>
            <span className="text-zinc-500">Total Records: </span>
            <span className="text-black ml-1">{shipments.length}</span>
          </div>
          <div>
            <span className="text-zinc-500">Active View: </span>
            <span className="text-black ml-1">{filteredShipments.length}</span>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-3xl p-16 text-center shadow-sm animate-modern-fade">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-zinc-200/50">
            <Package className="text-zinc-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-black mb-2 tracking-tight">No shipments found</h3>
          <p className="text-zinc-500 text-sm mb-8">Try adjusting your filters or create a new shipment</p>
          <Link to="/user/create">
            <Button className="h-11 px-6 rounded-xl border-zinc-200 bg-white text-black hover:bg-zinc-50 shadow-sm border font-semibold">
              Create Shipment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredShipments.map((shipment, i) => (
            <div 
              key={shipment._id} 
              className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all duration-300 group animate-modern-fade"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-mono text-sm font-bold text-black bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200/50 group-hover:bg-zinc-200 transition-colors">
                        {shipment.trackingNumber}
                      </span>
                      <StatusBadge status={shipment.status} />
                    </div>

                    <div className="flex items-stretch gap-6">
                      <div className="flex flex-col items-center gap-1.5 pt-2">
                        <div className="w-3 h-3 rounded-full bg-black shrink-0 border-2 border-white shadow-sm" />
                        <div className="w-0.5 flex-1 bg-zinc-200 rounded-full" />
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-white shrink-0 shadow-sm" />
                      </div>
                      
                      <div className="flex flex-col justify-between min-h-[70px]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Origin</p>
                          <p className="text-sm font-semibold text-black">{shipment.from || 'N/A'}</p>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Destination</p>
                          <p className="text-sm font-semibold text-black">{shipment.to || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-6 shrink-0 lg:w-[280px]">
                    <div className="w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distance</p>
                          <p className="text-base font-black text-black">
                            {shipment.distance ? `${shipment.distance.toFixed(1)} km` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
                            <Clock size={10} /> ETA
                          </p>
                          <p className="text-base font-black text-black">
                            {formatETA(shipment.currentETA)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Link to={`/user/track/${shipment._id}`} className="flex-1 sm:flex-none">
                        <Button className="w-full h-11 px-6 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-xl transition-all">
                          <Eye size={16} className="mr-2" />
                          Track
                        </Button>
                      </Link>

                      {shipment.status === 'pending' && (
                        <Button
                          variant="danger"
                          className="h-11 w-11 p-0 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all shrink-0"
                          onClick={() => handleDelete(shipment._id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-zinc-50/80 px-6 md:px-8 py-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                {shipment.assignedDriver ? (
                   <p className="text-xs font-semibold text-zinc-600">
                     <span className="text-zinc-400 font-medium">Assigned to:</span> {shipment.assignedDriver.displayName}
                   </p>
                ) : (
                   <p className="text-xs font-semibold text-zinc-400 italic">Unassigned</p>
                )}
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>Created: <span className="text-zinc-600">{new Date(shipment.createdAt).toLocaleDateString()}</span></span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}