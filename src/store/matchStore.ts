import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Match } from '../types/match';

interface MatchState {
  matches: Match[];
  
  // アクション
  addMatch: (match: Match) => void;
  updateMatch: (id: string, fields: Partial<Omit<Match, 'id'>>) => void;
  deleteMatch: (matchId: string) => void;
  
  // セレクタ
  getMatchesByCustomId: (customId: string) => Match[];
  getMatchById: (matchId: string) => Match | undefined;
}

export const useMatchStore = create<MatchState>()(
  devtools(
    persist(
      (set, get) => ({
        matches: [],
        
        addMatch: (match) => set((state) => ({
          matches: [...state.matches, match],
        }), false, 'addMatch'), // アクション名を指定
        
        updateMatch: (id, fields) => set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id === id) {
              return { ...m, ...fields };
            }
            return m;
          }),
        }), false, 'updateMatch'), // アクション名を指定
        
        deleteMatch: (matchId) => set((state) => ({
          matches: state.matches.filter((m) => m.id !== matchId),
        }), false, 'deleteMatch'), // アクション名を指定
        
        getMatchesByCustomId: (customId) => {
          return get().matches
            .filter((match) => match.customId === customId)
            .sort((a, b) => a.matchNumber - b.matchNumber);
        },
        
        getMatchById: (matchId) => {
          return get().matches.find((match) => match.id === matchId);
        },
      }),
      {
        name: 'match-storage',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'MatchStore' } // DevToolsでの表示名
  )
);
