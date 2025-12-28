import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Truck, BarChart3, Menu, X, LogOut, Plus, Navigation, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const getMenuItems = (role) => {
  const menus = {
    user: [
      { icon: LayoutDashboard, label: 'Overview', path: '/user/dashboard' },
      { icon: Plus, label: 'New Shipment', path: '/user/create' },
      { icon: Package, label: 'History', path: '/user/shipments' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
      { icon: Package, label: 'Shipments', path: '/admin/shipments' },
      { icon: Users, label: 'User Mgmt', path: '/admin/users' },
      { icon: Truck, label: 'Fleet', path: '/admin/drivers' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    ],
    driver: [
      { icon: LayoutDashboard, label: 'Overview', path: '/driver/dashboard' },
      { icon: Package, label: 'Deliveries', path: '/driver/deliveries' },
      { icon: Navigation, label: 'Route', path: '/driver/navigate' },
    ],
  };
  return menus[role] || menus.user;
};

export default function DashboardLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = getMenuItems(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-zinc-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-brand-zinc-200 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-sm">
            <Menu size={20} />
          </button>
          
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm">
              <Truck size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">SUPPLY TRACKER</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-black">{user?.displayName}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{user?.role}</p>
          </div>
          <div className="h-8 w-px bg-zinc-200 mx-2"></div>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-600 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-brand-zinc-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          mt-16 lg:mt-0 pt-6 pb-10 flex flex-col justify-between
        `}>
          <nav className="px-4 space-y-1">
            <p className="px-4 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Menu</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-sm text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-black text-white' 
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </nav>
          
          <div className="px-8">
            <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
              <p className="text-xs text-zinc-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-black">System Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {title && (
              <header className="mb-8 border-b border-zinc-200 pb-4">
                <h1 className="text-2xl font-bold text-black tracking-tight">{title}</h1>
              </header>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}