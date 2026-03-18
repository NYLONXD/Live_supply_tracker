// client/src/hooks/useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function useAuth(requiredRole = null) {
  const navigate = useNavigate();
  const { user, loading, initialized, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
      return;
    }

    if (!user && !loading) {
      navigate('/login');
      return;
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard
      switch (user?.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'driver':
          navigate('/driver/dashboard');
          break;
        default:
          navigate('/track');
      }
    }
  }, [user, requiredRole, navigate, loading, initialized, checkAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isUser: user?.role === 'user',
  };
}

// Hook for checking permissions
export function usePermission() {
  const { user } = useAuthStore();

  const can = (action) => {
    const permissions = {
      admin: ['create', 'read', 'update', 'delete', 'assign', 'manage_users'],
      driver: ['read', 'update_status', 'update_location'],
      user: ['create', 'read', 'track'],
    };

    return permissions[user?.role]?.includes(action) || false;
  };

  return { can };
}
