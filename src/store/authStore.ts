import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sha256 } from 'js-sha256';
import type { AuthState } from '../types/auth';

// 開発用の招待コードハッシュ（本番環境では環境変数から取得）
// 招待コード: "apex2025"
const DEV_INVITE_CODE_HASH = '1a94c578e682bfbe6bcdb2ab0ae4be34665e22eeb032f7cbb021b56041a6d69a';

// 環境変数から招待コードのハッシュを取得（なければ開発用のハッシュを使用）
const INVITE_CODE_HASH = import.meta.env.VITE_INVITE_CODE_HASH || DEV_INVITE_CODE_HASH;

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
