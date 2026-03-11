import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set) => ({
  // ✅ Hydrate from localStorage on init (token stored separately from user)
  user:    JSON.parse(localStorage.getItem('user'))  || null,
  token:   localStorage.getItem('token')             || null,
  loading: false,

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(credentials);

      // ✅ Fixed: separate token from user data so they don't duplicate
      const { token, ...userData } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, token, loading: false });

      toast.success('Login successful!');
      return userData;
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

      // ✅ Fixed: same separation as login
      const { token, ...user } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });

      toast.success('Registration successful!');
      return user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    toast.success('Logged out successfully');
    // ✅ Redirect so user doesn't stay on a protected page
    window.location.href = '/login';
  },

  // ─── Set Auth (used after password reset) ─────────────────────────────────
  // ✅ Fixed: was missing entirely — ResetPassword.jsx was crashing
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
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
}));

export default useAuthStore;