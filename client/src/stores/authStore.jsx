import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  initialized: false,

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, loading: false, initialized: true });

      toast.success('Login successful!');
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, loading: false, initialized: true });

      toast.success('Registration successful!');
      return data;
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

  // ─── Set Auth (used after password reset) ─────────────────────────────────
  setAuth: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, initialized: true });
  },

  // ─── Update User (refresh profile from server) ────────────────────────────
  updateUser: async () => {
    set({ loading: true });
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to update user:', error);
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, loading: false, initialized: true });
    } catch (error) {
      localStorage.removeItem('user');
      set({ user: null, loading: false, initialized: true });
    }
  },
}));

export default useAuthStore;
