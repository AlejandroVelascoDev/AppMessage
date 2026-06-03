import { create } from 'zustand';

import { logout } from '@/services/auth.api';
import { getMe } from '@/services/users.api';

type AuthState = {
  user: any | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const user = await getMe();
      set({ user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await logout();
    set({ user: null });
  },
}));
