import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { authApi, getErrorMessage } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'SCAFFOLDER' | 'ENGINEER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: 'OWNER' | 'SCAFFOLDER' | 'ENGINEER' }) => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  getToken: () => Promise<string | null>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(email, password);
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { accessToken } = get();
    try {
      if (accessToken) {
        await authApi.logout();
      }
    } catch {
      // Ignore logout errors - user should be logged out regardless
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
    router.replace('/auth/login');
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const { data: response } = await authApi.register(data);
      await SecureStore.setItemAsync('accessToken', response.accessToken);
      await SecureStore.setItemAsync('refreshToken', response.refreshToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authApi.me();
      set({
        user: data,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  getToken: async () => {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));
