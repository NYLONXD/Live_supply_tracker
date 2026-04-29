import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, UserPlus, MapPin, Package, Settings2 } from 'lucide-react';
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
          s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      pending:    { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/20', glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]' },
      assigned:   { bg: 'bg-neon-purple/10', text: 'text-neon-purple', border: 'border-neon-purple/20', glow: 'shadow-[0_0_10px_rgba(180,0,255,0.2)]' },
      picked_up:  { bg: 'bg-neon-pink/10', text: 'text-neon-pink', border: 'border-neon-pink/20', glow: 'shadow-[0_0_10px_rgba(255,0,102,0.2)]' },
      in_transit: { bg: 'bg-neon-blue/10', text: 'text-neon-blue', border: 'border-neon-blue/20', glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)] animate-pulse' },
      delivered:  { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/20', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.2)]' },
      cancelled:  { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', glow: 'shadow-[0_0_10px_rgba(220,38,38,0.2)]' },
    };

    const style = config[status] || config.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${style.bg} ${style.text} ${style.border} ${style.glow}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Logistics Ledger">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Logistics Ledger">
      
      {/* Filters Section */}
      <div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-1 relative">
            <Input
              icon={Search}
              placeholder="Search hashes, clients, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white w-full h-12"
            />
          </div>

          <div className="relative">
            <Settings2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 pl-10 pr-4 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-neon-blue appearance-none uppercase text-xs font-bold tracking-wider"
            >
              <option value="all">Global Network</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <Link to="/admin/shipments/create" className="w-full md:w-auto">
            <Button className="w-full md:w-auto h-12 bg-white text-black hover:bg-zinc-200" icon={Package}>Deploy Shipment</Button>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5 pt-4">
          <span>{filteredShipments.length} Active Nodes found</span>
          <span>{shipments.length} Total Logs</span>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking Hash</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Trajectory</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Client Intel</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Operator</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/20">
              {filteredShipments.map((shipment) => (
                <tr
                  key={shipment._id}
                  className="hover:bg-white/[0.04] transition-colors group"
                >
                  <td className="py-4 px-6 font-mono text-sm text-neon-blue font-bold tracking-tight">
                    {shipment.trackingNumber}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                        <span className="truncate max-w-[150px]">{shipment.from.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
                        <span className="truncate max-w-[150px]">{shipment.to.split(',')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{shipment.customerName || 'N/A'}</div>
                    {shipment.customerPhone && (
                      <div className="text-xs text-muted-foreground mt-0.5">{shipment.customerPhone}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(shipment.status)}
                  </td>
                  <td className="py-4 px-6">
                    {assigningDriver === shipment._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-black border border-neon-blue/50 rounded-md text-white focus:outline-none focus:border-neon-blue"
                        >
                          <option value="">Select Operator</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.displayName}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="neon"
                          className="px-3 py-1.5 h-auto text-xs"
                          onClick={() => handleAssignDriver(shipment._id)}
                        >
                          SET
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-2 py-1.5 h-auto text-muted-foreground hover:text-white"
                          onClick={() => {
                            setAssigningDriver(null);
                            setSelectedDriver('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {shipment.assignedDriver ? (
                          <span className="text-sm font-medium text-white bg-white/10 px-3 py-1 rounded-full border border-white/10">
                            {shipment.assignedDriver.displayName}
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {!shipment.assignedDriver && shipment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 hover:border-neon-blue hover:text-neon-blue w-9 h-9 p-0 flex items-center justify-center rounded-lg"
                          onClick={() => setAssigningDriver(shipment._id)}
                          title="Assign Operator"
                        >
                          <UserPlus size={16} />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-9 h-9 p-0 flex items-center justify-center rounded-lg"
                        onClick={() => handleDelete(shipment._id)}
                        title="Delete Instance"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Package size={32} className="mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm font-bold text-white uppercase tracking-widest">No matching logs found</p>
                    <p className="text-xs text-muted-foreground mt-1">Adjust your filters or initiate a new deployment.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
