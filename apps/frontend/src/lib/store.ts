import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',

      // only persisting token and user as the 
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

interface GameUIState {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useGameUIStore = create<GameUIState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
