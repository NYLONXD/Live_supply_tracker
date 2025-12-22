// client/src/hooks/useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function useAuth(requiredRole = null) {
  const navigate = useNavigate();
  const { user, token, loading, updateUser } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!token && !loading) {
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
          navigate('/user/dashboard');
      }
    }

    // Refresh user data if token exists but user data is stale
    if (token && !user) {
      updateUser();
    }
  }, [token, user, requiredRole, navigate, loading, updateUser]);

  return {
    user,
    token,
    loading,
    isAuthenticated: !!token,
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