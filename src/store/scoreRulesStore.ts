import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScoreRules } from '../types/score';

interface ScoreRulesState {
  rules: ScoreRules[];
  
  // アクション
  addRule: (rule: ScoreRules) => void;
  updateRule: (rule: ScoreRules) => void;
  deleteRuleByMatchId: (matchId: string) => void;
  
  // セレクタ
  getRulesByCustomId: (customId: string) => ScoreRules[];
  getRuleByMatchId: (matchId: string) => ScoreRules | undefined;
  getDefaultRule: (previousMatchId?: string) => Pick<ScoreRules, 'killPointCap' | 'placementPoints'>;
}

export const useScoreRulesStore = create<ScoreRulesState>()(
  persist(
    (set, get) => ({
      rules: [],
      
      addRule: (rule) => set((state) => ({
        rules: [...state.rules, rule],
      })),
      
      updateRule: (rule) => set((state) => ({
        rules: state.rules.map((r) => (r.matchId === rule.matchId ? rule : r)),
      })),
      
      deleteRuleByMatchId: (matchId) => set((state) => ({
        rules: state.rules.filter((r) => r.matchId !== matchId),
      })),
      
      getRulesByCustomId: (customId) => {
        return get().rules.filter((rule) => rule.customId === customId);
      },
      
      getRuleByMatchId: (matchId) => {
        return get().rules.find((rule) => rule.matchId === matchId);
      },
      
      getDefaultRule: (previousMatchId?: string) => {
        if (previousMatchId) {
          // 指定されたマッチIDのルールを取得
          const rule = get().getRuleByMatchId(previousMatchId);
          
          // ルールが存在する場合は、そのルールを返す
          if (rule) {
            return {
              killPointCap: rule.killPointCap,
              placementPoints: rule.placementPoints
            };
          }
        }
        
        // デフォルトのルールを返す
        return {
          killPointCap: 0,
          placementPoints: [12, 9, 7, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        };
      },
    }),
    {
      name: 'score-rules-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
