import { vi } from 'vitest';
import { useCustomStore } from '../store/customStore';
import { useMatchStore } from '../store/matchStore';
import { useScoreRulesStore } from '../store/scoreRulesStore';
import type { Match } from '../types/match';
import type { Custom } from '../types/custom';
import type { ScoreRules } from '../types/score';

// matchStore.tsのMatchStateインターフェースを再定義
interface MatchState {
  matches: Match[];
  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (matchId: string) => void;
  getMatchesByCustomId: (customId: string) => Match[];
  getMatchById: (matchId: string) => Match | undefined;
}

// scoreRulesStore.tsのScoreRulesStateインターフェースを再定義
interface ScoreRulesState {
  rules: ScoreRules[];
  addRule: (rule: ScoreRules) => void;
  updateRule: (rule: ScoreRules) => void;
  deleteRule: (id: string) => void;
  getRulesByCustomId: (customId: string) => ScoreRules[];
  getRuleByMatchId: (matchId: string) => ScoreRules | undefined;
  getDefaultRules: (previousMatchId?: string) => Pick<ScoreRules, "killPointCap" | "placementPoints">;
}

// カスタムストアのモック
vi.mock('../store/customStore', () => ({
  useCustomStore: vi.fn()
}));

// マッチストアのモック
vi.mock('../store/matchStore', () => ({
  useMatchStore: vi.fn()
}));

// スコアルールストアのモック
vi.mock('../store/scoreRulesStore', () => ({
  useScoreRulesStore: vi.fn()
}));

// 型安全なモック関数
export const mockUseCustomStore = (overrides: Partial<ReturnType<typeof useCustomStore>> = {}) => {
  const mockedUseCustomStore = useCustomStore as unknown as ReturnType<typeof vi.fn>;
  
  mockedUseCustomStore.mockImplementation((selector: any) => {
    return selector({
      currentMatchId: 'mock-match-id',
      getCurrentCustom: () => ({ id: 'mock-custom-id', name: 'モックカスタム', createdAt: Date.now() }),
      ...overrides
    });
  });
};

export const mockUseMatchStore = (overrides: Partial<MatchState> = {}) => {
  const mockedUseMatchStore = useMatchStore as unknown as ReturnType<typeof vi.fn>;
  
  // デフォルトのマッチデータ
  const defaultMatch = {
    id: 'mock-match-id',
    customId: 'mock-custom-id',
    matchNumber: 1,
    teams: [],
    createdAt: Date.now()
  };
  
  // デフォルトのmatches配列
  const defaultMatches = [defaultMatch];
  
  // getMatchByIdのデフォルト実装
  const defaultGetMatchById = vi.fn().mockImplementation((id: string) => {
    return defaultMatches.find(match => match.id === id) || defaultMatch;
  });
  
  mockedUseMatchStore.mockImplementation((selector: any) => {
    const state: MatchState = {
      matches: overrides.matches || defaultMatches,
      getMatchById: overrides.getMatchById || defaultGetMatchById,
      updateMatch: overrides.updateMatch || vi.fn(),
      addMatch: overrides.addMatch || vi.fn(),
      deleteMatch: overrides.deleteMatch || vi.fn(),
      getMatchesByCustomId: overrides.getMatchesByCustomId || vi.fn().mockReturnValue([])
    };
    
    return selector(state);
  });
};

export const mockUseScoreRulesStore = (overrides: Partial<ScoreRulesState> = {}) => {
  const mockedUseScoreRulesStore = useScoreRulesStore as unknown as ReturnType<typeof vi.fn>;
  
  // デフォルトのルールデータ
  const defaultRule = {
    id: 'mock-rule-id',
    customId: 'mock-custom-id',
    matchId: 'mock-match-id',
    killPointCap: 0,
    placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
  };
  
  // デフォルトのrules配列
  const defaultRules = [defaultRule];
  
  // getRuleByMatchIdのデフォルト実装
  const defaultGetRuleByMatchId = vi.fn().mockImplementation((id: string) => {
    return defaultRules.find(rule => rule.matchId === id);
  });
  
  mockedUseScoreRulesStore.mockImplementation((selector: any) => {
    const state: ScoreRulesState = {
      rules: overrides.rules || defaultRules,
      addRule: overrides.addRule || vi.fn(),
      updateRule: overrides.updateRule || vi.fn(),
      deleteRule: overrides.deleteRule || vi.fn(),
      getRulesByCustomId: overrides.getRulesByCustomId || vi.fn().mockReturnValue([]),
      getRuleByMatchId: overrides.getRuleByMatchId || defaultGetRuleByMatchId,
      getDefaultRules: overrides.getDefaultRules || vi.fn().mockReturnValue({ 
        killPointCap: 0, 
        placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1] 
      })
    };
    
    return selector(state);
  });
};
