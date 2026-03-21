import { create } from 'zustand';
import type { User, RoleName } from '@/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (...roles: RoleName[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: async (email: string, _password: string) => {
    // Mock login — find user by email
    const user = mockUsers.find((u) => u.email === email);
    if (!user) return false;

    set({
      user,
      accessToken: 'mock-jwt-token',
      isAuthenticated: true,
    });
    return true;
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  hasRole: (...roles: RoleName[]) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role.name);
  },
}));
