// client/src/components/common/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Truck, BarChart3, Menu,
  LogOut, Plus, Navigation, ChevronRight, MessageSquare, Bell
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import NotificationBell from './NotificationBell';
import trackEdgeLogo from '../../assets/trackEdge.png';

const getMenuItems = (role) => {
  const adminShared = [
    { icon: MessageSquare, label: 'Support',  path: '/support/tickets' },
    { icon: Bell,          label: 'Alerts',   path: '/notifications' },
  ];

  const memberShared = [
    { icon: MessageSquare, label: 'Support',  path: '/support' },
  ];

  const menus = {
    admin: [
      { icon: LayoutDashboard, label: 'Overview',        path: '/admin/dashboard' },
      { icon: Plus,            label: 'Create Shipment', path: '/admin/shipments/create' },
      { icon: Package,         label: 'Shipments',       path: '/admin/shipments' },
      { icon: Users,           label: 'User Mgmt',       path: '/admin/users' },
      { icon: Truck,           label: 'Fleet',           path: '/admin/drivers' },
      ...adminShared,
    ],
    driver: [
      { icon: LayoutDashboard, label: 'Overview',   path: '/driver/dashboard' },
      { icon: Package,         label: 'Deliveries', path: '/driver/deliveries' },
      { icon: Navigation,      label: 'Route',      path: '/driver/navigate' },
      ...memberShared,
    ],
    user: [
      { icon: LayoutDashboard, label: 'Dashboard',  path: '/user/dashboard' },
      { icon: Plus,            label: 'New Shipment', path: '/user/create' },
      { icon: Package,         label: 'My Shipments', path: '/user/shipments' },
      ...memberShared,
    ],
  };

  return menus[role] || memberShared;
};

const isActivePath = (menuPath, currentPath) => {
  if (menuPath === currentPath) return true;
  if (menuPath === '/support/tickets' && currentPath.startsWith('/support/tickets')) return true;
  return false;
};

export default function DashboardLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = getMenuItems(user?.role);
  const isDarkMode = user?.role === 'admin' || user?.role === 'driver';

  // Apply dark mode class to document body based on role
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}>
      {/* Dynamic Background Effects */}
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/5 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Top Navbar */}
      <nav className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-md text-muted-foreground"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-3 group">
            <img src={trackEdgeLogo} alt="Supply Tracker" className="h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <span className="text-lg font-bold tracking-tight hidden sm:block">SUPPLY TRACKER</span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="h-6 w-px bg-border mx-2" />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{user?.displayName}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-64 bg-background/95 backdrop-blur-xl border-r border-border
            transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0 pt-6 pb-8 flex flex-col justify-between
          `}
        >
          <nav className="px-3 space-y-1">
            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path, location.pathname);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="opacity-70" />}
                </Link>
              );
            })}
          </nav>

          <div className="px-6">
            <div className="glass p-4 rounded-xl flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                <p className="text-xs font-bold text-foreground">System Online</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto animate-modern-fade">
            {title && (
              <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{title}</h1>
                <div className="h-1 w-10 bg-primary mt-2 rounded-full" />
              </header>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}