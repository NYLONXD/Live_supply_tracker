import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';

// Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

// User Pages
import UserDashboard from './pages/User/Dashboard';
import CreateShipment from './pages/User/CreateShipment';
import MyShipments from './pages/User/MyShipments';
import TrackShipment from './pages/User/TrackShipment';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AllShipments from './pages/Admin/AllShipments';
import Users from './pages/Admin/Users';
import Drivers from './pages/Admin/Drivers';
import Analytics from './pages/Admin/Analytics';

// Driver Pages
import DriverDashboard from './pages/Driver/Dashboard';
import MyDeliveries from './pages/Driver/MyDeliveries';
import Navigation from './pages/Driver/Navigation';

// Public Pages
import PublicTrack from './pages/Public/Track';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Role-based redirect
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'driver':
      return <Navigate to="/driver/dashboard" replace />;
    default:
      return <Navigate to="/user/dashboard" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #475569',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/track/:trackingNumber" element={<PublicTrack />} />

        {/* Role-based Home */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* User Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/create"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CreateShipment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/shipments"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <MyShipments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/track/:id"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <TrackShipment />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllShipments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Driver Routes */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/deliveries"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <MyDeliveries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/navigate/:id"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <Navigation />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;