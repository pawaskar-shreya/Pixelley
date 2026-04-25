import { create } from 'zustand';
import { User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: 'local-player', username: 'Player1' }, // Mock initial user
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));

interface GameUIState {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useGameUIStore = create<GameUIState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
