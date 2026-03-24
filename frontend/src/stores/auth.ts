import { create } from 'zustand';
import type { User, RoleName } from '@/types';
import { loginApi, logoutApi, getMeApi, refreshTokenApi } from '@/features/auth/api';
import { isAxiosError } from 'axios';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  hasRole: (...roles: RoleName[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { accessToken } = await loginApi(email, password);
    set({ accessToken, isAuthenticated: true });

    // Fetch user profile after login
    const { data: user } = await getMeApi();
    set({ user });
  },

  loginWithGoogle: () => {
    // Redirect to backend Google OAuth endpoint
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
    window.location.href = `${baseUrl}/auth/google`;
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // Clear state even if API fails
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data: user } = await getMeApi();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  refreshToken: async () => {
    try {
      const { accessToken } = await refreshTokenApi();
      set({ accessToken, isAuthenticated: true });
      return accessToken;
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
      return null;
    }
  },

  hasRole: (...roles: RoleName[]) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role.name);
  },
}));
