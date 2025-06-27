import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Match } from '../types/match';

interface MatchState {
  matches: Match[];
  
  // アクション
  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (matchId: string) => void;
  
  // セレクタ
  getMatchesByCustomId: (customId: string) => Match[];
  getMatchById: (matchId: string) => Match | undefined;
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      matches: [],
      
      addMatch: (match) => set((state) => ({
        matches: [...state.matches, match],
      })),
      
      updateMatch: (match) => set((state) => ({
        matches: state.matches.map((m) => (m.id === match.id ? match : m)),
      })),
      
      deleteMatch: (matchId) => set((state) => ({
        matches: state.matches.filter((m) => m.id !== matchId),
      })),
      
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
  )
);
