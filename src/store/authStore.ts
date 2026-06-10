import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/lib/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  pendingToken: string | null;
  twoFactorMethod: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setPending: (pendingToken: string, method: string) => void;
  clearPending: () => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  _setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      pendingToken: null,
      twoFactorMethod: null,
      _hasHydrated: false,
      setAuth: (user, token) => {
        sessionStorage.setItem('token', token);
        set({ user, token, pendingToken: null, twoFactorMethod: null });
      },
      setPending: (pendingToken, method) => {
        set({ pendingToken, twoFactorMethod: method, user: null, token: null });
      },
      clearPending: () => {
        set({ pendingToken: null, twoFactorMethod: null });
      },
      logout: () => {
        sessionStorage.removeItem('token');
        set({ user: null, token: null, pendingToken: null, twoFactorMethod: null });
      },
      fetchMe: async () => {
        try {
          const res = await api.get('/me');
          set({ user: res.data });
        } catch {
          set({ user: null, token: null });
          sessionStorage.removeItem('token');
        }
      },
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'auth-store',
      // sessionStorage clears automatically when the browser is closed
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ token: s.token, user: s.user, pendingToken: s.pendingToken, twoFactorMethod: s.twoFactorMethod }),
      onRehydrateStorage: () => (state) => { state?._setHasHydrated(true); },
    }
  )
);
