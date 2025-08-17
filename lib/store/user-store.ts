import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility actions
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  
  // Basic setters
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Utility actions
  clearUser: () => set({
    user: null,
    isLoading: false,
    error: null,
  }),
}));
