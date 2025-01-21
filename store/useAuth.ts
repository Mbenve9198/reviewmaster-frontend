// store/useAuth.ts
import { create } from 'zustand';
import { authApi } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.login(email, password);
      set({ token, user, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false 
      });
      throw error;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const user = await authApi.getProfile();
      set({ user, loading: false });
    } catch (error) {
      set({ user: null, token: null, loading: false });
    }
  },
}));

export default useAuth;