// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';

// Public Pages
import Landing          from './pages/Public/Landing';
import PublicTrack      from './pages/Public/Track';

// Auth Pages
import Login            from './pages/Auth/Login';
import Signup           from './pages/Auth/RegisterShop';
import RegisterShop     from './pages/Auth/RegisterShop';
import ForgetPassword   from './pages/Auth/ForgetPassword';
import ResetPassword    from './pages/Auth/ResetPassword';

// Admin Pages
import AdminDashboard     from './pages/Admin/Dashboard';
import AllShipments       from './pages/Admin/AllShipments';
import Users              from './pages/Admin/Users';
import Drivers            from './pages/Admin/Drivers';
import Analytics          from './pages/Admin/Analytics';
import AdminCreateShipment from './pages/Admin/CreateShipment';
import JoinOrg             from './pages/Auth/JoinOrg';

// Driver Pages
import DriverDashboard  from './pages/Driver/Dashboard';
import MyDeliveries     from './pages/Driver/MyDeliveries';
import Navigation       from './pages/Driver/Navigation';

// ─── Protected Route ─────────────────────────────────────────────────────────
// Guards:
//   1. Must be logged in
//   2. Must have one of the allowedRoles
//   3. admin / driver must have an organizationId — if not, send to /register-shop
//      (this catches old accounts created before multi-tenancy, or any edge case
//       where attachTenant would otherwise return 403)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, initialized, loading } = useAuthStore();

  // Still bootstrapping — show a blank loader rather than redirecting early
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;

  // Admin or driver without an org → redirect to shop registration
  // This prevents a confusing 403 from the backend's attachTenant middleware
  if (['admin', 'driver'].includes(user.role) && !user.organizationId)
    return <Navigate to="/register-shop" replace />;

  return children;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Validate the JWT cookie on every cold load.
  // checkAuth() calls /api/auth/me, normalizes the response, and sets the store.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/"                        element={<Landing />} />
        <Route path="/track"                   element={<PublicTrack />} />
        <Route path="/track/:trackingNumber"   element={<PublicTrack />} />

        {/* ── Auth ───────────────────────────────────────────────────────── */}
        <Route path="/login"                   element={<Login />} />
        <Route path="/signup"                  element={<Signup />} />
        <Route path="/register-shop"           element={<RegisterShop />} />
        <Route path="/forgot-password"         element={<ForgetPassword />} />
        <Route path="/reset-password/:token"   element={<ResetPassword />} />
        <Route path="/join/:token" element={<JoinOrg />} />


        {/* ── Admin ──────────────────────────────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipments/create"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCreateShipment />
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

        {/* ── Driver ─────────────────────────────────────────────────────── */}
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

        {/* ── Catch-all ──────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/track" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;