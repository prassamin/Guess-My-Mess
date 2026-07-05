import { create } from 'zustand';

interface User {
  id: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  [key: string]: any;
}

interface AppStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
