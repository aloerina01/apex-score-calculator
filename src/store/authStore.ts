import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sha256 } from 'js-sha256';
import type { AuthState } from '../types/auth';

const INVITE_CODE_HASH = import.meta.env.VITE_INVITE_CODE_HASH;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasAgreedToTerms: false,
      login: (code: string) => {
        const hashedCode = sha256(code);
        const isValid = hashedCode === INVITE_CODE_HASH;
        if (isValid) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
      agreeToTerms: () => set({ hasAgreedToTerms: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
