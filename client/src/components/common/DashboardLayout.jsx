import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Menu,
  X,
  LogOut,
  Plus,
  Navigation,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const getMenuItems = (role) => {
  const menus = {
    user: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/user/dashboard' },
      { icon: Plus, label: 'Create Shipment', path: '/user/create' },
      { icon: Package, label: 'My Shipments', path: '/user/shipments' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Package, label: 'All Shipments', path: '/admin/shipments' },
      { icon: Users, label: 'Users', path: '/admin/users' },
      { icon: Truck, label: 'Drivers', path: '/admin/drivers' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    ],
    driver: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/driver/dashboard' },
      { icon: Package, label: 'My Deliveries', path: '/driver/deliveries' },
      { icon: Navigation, label: 'Navigation', path: '/driver/navigate' },
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
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Truck size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold hidden sm:block">Supply Tracker</span>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-200">{user?.displayName}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
              
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.displayName?.charAt(0) || 'U'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-red-400"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0
          `}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}