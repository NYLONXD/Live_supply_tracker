// client/src/stores/authStore.jsx
import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Normalize user shape ─────────────────────────────────────────────────────
// /api/auth/login + /api/organizations/register → { organizationId: "string" }
// /api/auth/me                                  → { organization: { _id, name } }
// This flattens both shapes and always preserves isEmailVerified.
const normalize = (data) => ({
  ...data,
  organizationId:  data.organization?._id ?? data.organizationId ?? null,
  isEmailVerified: data.isEmailVerified ?? undefined,
});

const useAuthStore = create((set, get) => ({
  user:        JSON.parse(localStorage.getItem('user')) || null,
  loading:     false,
  initialized: false,

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(credentials);
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

  // ─── Register (plain user) ────────────────────────────────────────────────
  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.register(userData);
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false, initialized: true });
      toast.success('Account created! Please verify your email.');
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
  // Called after: org registration, password reset, manual updates (e.g. verify)
  setAuth: (data) => {
    const current = get().user;
    // Merge with current user so partial updates (like { isEmailVerified: true })
    // don't wipe out other fields
    const merged = normalize({ ...current, ...data });
    localStorage.setItem('user', JSON.stringify(merged));
    set({ user: merged, initialized: true });
  },

  // ─── Update User (refresh from server) ────────────────────────────────────
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

  // ─── Check Auth (runs on cold load) ──────────────────────────────────────
  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await authAPI.getMe();
      const normalized = normalize(data);
      localStorage.setItem('user', JSON.stringify(normalized));
      set({ user: normalized, loading: false, initialized: true });
    } catch (error) {
      localStorage.removeItem('user');
      set({ user: null, loading: false, initialized: true });
    }
  },
}));

export default useAuthStore;