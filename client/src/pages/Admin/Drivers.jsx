// ===== Drivers.jsx =====
import { useEffect, useState } from 'react';
import { Search, Truck, UserMinus, ShieldAlert, Cpu } from 'lucide-react';
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
    if (!confirm('Demote this operative to standard client clearance?')) return;
    try {
      await adminAPI.demoteDriver(userId);
      toast.success('Operative clearance demoted');
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
      <DashboardLayout title="Fleet Command">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fleet Command">
      <div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Active Fleet Roster</h2>
            <p className="text-xs text-muted-foreground">Manage authorized field operatives and their assets.</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <Input
            icon={Search}
            placeholder="Search operatives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white w-full h-10"
          />
        </div>
        
        <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5 pt-4">
          <span>{filteredDrivers.length} matching operatives</span>
          <span>{drivers.length} total operatives</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-modern-fade" style={{ animationDelay: '0.1s' }}>
        {filteredDrivers.map((driver) => (
          <div key={driver._id} className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-neon-blue/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all duration-300 group relative flex flex-col h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="p-6 flex-1 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] mb-4 relative group-hover:scale-110 transition-transform duration-300">
                <Truck className="text-neon-blue" size={28} />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon-green rounded-full border-2 border-[#121212] shadow-[0_0_8px_rgba(0,255,102,0.8)]" title="Active" />
              </div>
              
              <h3 className="font-extrabold text-white text-lg tracking-tight mb-1">{driver.displayName}</h3>
              <p className="text-xs font-mono text-neon-blue/80 mb-4">{driver.email}</p>
              
              <div className="w-full space-y-2 mt-auto">
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Asset</span>
                  <span className="text-xs text-white font-medium">{driver.vehicleInfo || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registry ID</span>
                  <span className="text-xs font-mono text-white">{driver.vehicleNumber || 'Pending'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-black/20">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive text-xs h-9 uppercase tracking-widest font-bold"
                onClick={() => handleDemote(driver._id)}
              >
                <UserMinus size={14} className="mr-2" />
                Revoke Clearance
              </Button>
            </div>
          </div>
        ))}
        {filteredDrivers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-center glass-dark border border-white/10 rounded-2xl">
            <ShieldAlert size={40} className="text-muted-foreground opacity-50 mb-4" />
            <p className="text-sm font-bold text-white uppercase tracking-widest">No Operatives Found</p>
            <p className="text-xs text-muted-foreground mt-2">Adjust your filters or recruit new drivers.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Drivers;