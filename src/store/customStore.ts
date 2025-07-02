import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Custom } from '../types/custom';
import type { Match } from '../types/match';

interface CustomState {
  customs: Custom[];
  currentCustomId: string | null;
  currentMatchId: string | null;
  
  // アクション
  addCustom: (custom: Custom) => void;
  updateCustom: (custom: Custom) => void;
  deleteCustom: (customId: string) => void;
  setCurrentCustom: (customId: string | null) => void;
  setCurrentMatch: (matchId: string | null) => void;
  
  // セレクタ
  getCurrentCustom: () => Custom | null;
  getCurrentMatch: () => Match | null;
}

export const useCustomStore = create<CustomState>()(
  devtools(
  persist(
    (set, get) => ({
      customs: [],
      currentCustomId: null,
      currentMatchId: null,
      
      addCustom: (custom) => set((state) => ({
        customs: [...state.customs, custom],
        currentCustomId: custom.id,
        currentMatchId: null,
      })),
      
      updateCustom: (custom) => set((state) => ({
        customs: state.customs.map((c) => (c.id === custom.id ? custom : c)),
      })),
      
      deleteCustom: (customId) => set((state) => ({
        customs: state.customs.filter((c) => c.id !== customId),
        currentCustomId: state.currentCustomId === customId ? null : state.currentCustomId,
        currentMatchId: state.currentMatchId ? null : state.currentMatchId,
      })),
      
      setCurrentCustom: (customId) => set({ 
        currentCustomId: customId, 
        currentMatchId: null // カスタム選択時はマッチ選択をクリア
      }),
      
      setCurrentMatch: (matchId) => set({ currentMatchId: matchId }),
      
      getCurrentCustom: () => {
        const { customs, currentCustomId } = get();
        return customs.find(c => c.id === currentCustomId) || null;
      },
      
      getCurrentMatch: () => {
        // 現在のカスタムとマッチIDを取得
        const { currentCustomId, currentMatchId } = get();
        if (!currentCustomId || !currentMatchId) return null;
        
        // マッチストアからマッチ情報を取得
        // 注: 実際の実装では、useMatchStore().getMatchById(currentMatchId)を使用します
        // ここでは循環参照を避けるため、外部から取得する方法を採用します
        return null;
      },
    }),
    {
      name: 'custom-storage',
      storage: createJSONStorage(() => localStorage),
    }
  ),{ name: 'CustomStore' } // DevToolsでの表示名
)
);
