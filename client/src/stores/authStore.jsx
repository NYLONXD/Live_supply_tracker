// client/src/stores/authStore.jsx
import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Helper ───────────────────────────────────────────────────────────────────
// /api/auth/login and /api/organizations/register return  { organizationId: "string" }
// /api/auth/me returns                                    { organization: { _id, name } }
// This function flattens both shapes into a consistent object that always
// has  user.organizationId  as a plain string (or null).
const normalize = (data) => ({
  ...data,
  organizationId: data.organization?._id ?? data.organizationId ?? null,
});

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  initialized: false,

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(credentials);
      // login response already has organizationId as a flat string,
      // normalize() handles both shapes safely
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false, initialized: true });
      toast.success('Login successful!');
      return normalized;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // ─── Register (plain user, no org) ────────────────────────────────────────
  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.register(userData);
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false, initialized: true });
      toast.success('Registration successful!');
      return normalized;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('user');
    set({ user: null, initialized: true });
    toast.success('Logged out successfully');
    window.location.href = '/login';
  },

  // ─── Set Auth ─────────────────────────────────────────────────────────────
  // Called after:
  //   • /api/organizations/register  → data has both organizationId + organization{}
  //   • /api/auth/reset-password     → data is the plain user shape
  // normalize() handles both safely.
  setAuth: (data) => {
    const normalized = normalize(data);
    localStorage.setItem('user', JSON.stringify(normalized));
    set({ user: normalized, initialized: true });
  },

  // ─── Update User (refresh profile from server) ────────────────────────────
  // /api/auth/me returns { organization: { _id, name, slug, plan } }
  // We flatten organization._id → organizationId so the rest of the
  // app (ProtectedRoute, admin guards, etc.) always finds user.organizationId.
  updateUser: async () => {
    set({ loading: true });
    try {
      const { data } = await authAPI.getMe();
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to update user:', error);
    }
  },

  // ─── Check Auth (runs on every app load) ─────────────────────────────────
  // Same normalization as updateUser — /api/auth/me returns the
  // populated organization object, not a plain organizationId string.
  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await authAPI.getMe();
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false, initialized: true });
    } catch (error) {
      // Token invalid / expired — clear everything
      localStorage.removeItem('user');
      set({ user: null, loading: false, initialized: true });
    }
  },
}));

export default useAuthStore;