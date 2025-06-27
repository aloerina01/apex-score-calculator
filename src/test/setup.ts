import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockUseCustomStore, mockUseMatchStore } from './mockStores';

// テスト後にクリーンアップを実行
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// グローバルなモックの設定
vi.mock('../services/geminiService', () => ({
  analyzeImage: vi.fn().mockResolvedValue([
    { rank: 1, team_name: 'チーム1', kill: 5 },
    { rank: 2, team_name: 'チーム2', kill: 3 },
    { rank: 3, team_name: 'チーム3', kill: 2 },
  ]),
}));

// デフォルトのストアモックを設定
beforeEach(() => {
  mockUseCustomStore();
  mockUseMatchStore();
});
