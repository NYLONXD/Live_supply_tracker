import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';

// Public Pages
import Landing from './pages/Public/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import PublicTrack from './pages/Public/Track';

// Role Specific Pages (Keep existing imports)
import UserDashboard from './pages/User/Dashboard';
import CreateShipment from './pages/User/CreateShipment';
import MyShipments from './pages/User/MyShipments';
import TrackShipment from './pages/User/TrackShipment';

import AdminDashboard from './pages/Admin/Dashboard';
import AllShipments from './pages/Admin/AllShipments';
import Users from './pages/Admin/Users';
import Drivers from './pages/Admin/Drivers';
import Analytics from './pages/Admin/Analytics';

import DriverDashboard from './pages/Driver/Dashboard';
import MyDeliveries from './pages/Driver/MyDeliveries';
import Navigation from './pages/Driver/Navigation';

// Component logic remains the same
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #333',
            borderRadius: '2px',
          },
          success: {
            iconTheme: { primary: '#ffffff', secondary: '#000000' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />

      <Routes>
        {/* NEW: Landing Page as Root */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/track/:trackingNumber" element={<PublicTrack />} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/create" element={<ProtectedRoute allowedRoles={['user']}><CreateShipment /></ProtectedRoute>} />
        <Route path="/user/shipments" element={<ProtectedRoute allowedRoles={['user']}><MyShipments /></ProtectedRoute>} />
        <Route path="/user/track/:id" element={<ProtectedRoute allowedRoles={['user']}><TrackShipment /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/shipments" element={<ProtectedRoute allowedRoles={['admin']}><AllShipments /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['admin']}><Drivers /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />

        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/deliveries" element={<ProtectedRoute allowedRoles={['driver']}><MyDeliveries /></ProtectedRoute>} />
        <Route path="/driver/navigate/:id" element={<ProtectedRoute allowedRoles={['driver']}><Navigation /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;