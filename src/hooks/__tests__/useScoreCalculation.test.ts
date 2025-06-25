import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useScoreCalculation } from '../useScoreCalculation';
import { analyzeImage } from '../../services/geminiService';
import type { ScoreRules } from '../../types/score';

// Gemini APIのモック
vi.mock('../../services/geminiService', () => ({
  analyzeImage: vi.fn()
}));

describe('useScoreCalculation', () => {
  // テスト用のモックデータ
  const mockCustomId = 'custom1';
  const mockRules: ScoreRules = {
    killPointCap: 0, // キルポイント上限なし
    placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
  };
  const mockOnCalculationComplete = vi.fn();
  
  // APIレスポンスのモック
  const mockApiResponse = [
    { rank: 1, team_name: 'チーム1', kill: 5 },
    { rank: 2, team_name: 'チーム2', kill: 3 },
    { rank: 3, team_name: 'チーム3', kill: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (analyzeImage as any).mockResolvedValue(mockApiResponse);
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, mockRules, mockOnCalculationComplete)
    );
    
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('計算が正しく行われること', async () => {
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, mockRules, mockOnCalculationComplete)
    );
    
    const imageUrl = 'data:image/png;base64,abc123';
    
    await act(async () => {
      await result.current.handleStartCalculation(imageUrl);
    });
    
    // APIが呼ばれたことを確認
    expect(analyzeImage).toHaveBeenCalledWith(imageUrl);
    
    // コールバックが呼ばれたことを確認
    expect(mockOnCalculationComplete).toHaveBeenCalledTimes(1);
    
    // 計算結果を確認
    const calculatedTeams = mockOnCalculationComplete.mock.calls[0][0];
    expect(calculatedTeams).toHaveLength(3);
    
    // 1位のチームの計算結果を確認
    const firstTeam = calculatedTeams[0];
    expect(firstTeam.teamId).toBe('custom1_チーム1');
    expect(firstTeam.teamName).toBe('チーム1');
    expect(firstTeam.placement).toBe(1);
    expect(firstTeam.kills).toBe(5);
    expect(firstTeam.placementPoints).toBe(12);
    expect(firstTeam.killPoints).toBe(5);
    expect(firstTeam.totalPoints).toBe(17);
    
    // 計算完了後の状態を確認
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('キルポイント上限がある場合、キルポイントが正しく計算されること', async () => {
    const rulesWithCap: ScoreRules = {
      ...mockRules,
      killPointCap: 3 // キルポイント上限3
    };
    
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, rulesWithCap, mockOnCalculationComplete)
    );
    
    const imageUrl = 'data:image/png;base64,abc123';
    
    await act(async () => {
      await result.current.handleStartCalculation(imageUrl);
    });
    
    // 計算結果を確認
    const calculatedTeams = mockOnCalculationComplete.mock.calls[0][0];
    
    // 1位のチームの計算結果を確認（キル5だがキルポイント上限3）
    const firstTeam = calculatedTeams[0];
    expect(firstTeam.kills).toBe(5);
    expect(firstTeam.killPoints).toBe(3); // キルポイント上限3の場合
    expect(firstTeam.totalPoints).toBe(15); // 12(順位ポイント) + 3(キルポイント)
  });

  it('APIエラーが発生した場合、エラー状態が設定されること', async () => {
    // APIエラーをモック
    (analyzeImage as any).mockRejectedValue(new Error('API error'));
    
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, mockRules, mockOnCalculationComplete)
    );
    
    const imageUrl = 'data:image/png;base64,abc123';
    
    await act(async () => {
      await result.current.handleStartCalculation(imageUrl);
    });
    
    // エラー状態を確認
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBe('API error');
    
    // コールバックが呼ばれていないことを確認
    expect(mockOnCalculationComplete).not.toHaveBeenCalled();
  });

  it('画像URLが空の場合、計算が行われないこと', async () => {
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, mockRules, mockOnCalculationComplete)
    );
    
    await act(async () => {
      await result.current.handleStartCalculation('');
    });
    
    // APIが呼ばれていないことを確認
    expect(analyzeImage).not.toHaveBeenCalled();
    
    // コールバックが呼ばれていないことを確認
    expect(mockOnCalculationComplete).not.toHaveBeenCalled();
    
    // 状態が変わっていないことを確認
    expect(result.current.isCalculating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('計算中はisCalculatingがtrueになること', async () => {
    // 非同期処理を遅延させる
    (analyzeImage as any).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(mockApiResponse), 100);
    }));
    
    const { result } = renderHook(() => 
      useScoreCalculation(mockCustomId, mockRules, mockOnCalculationComplete)
    );
    
    const imageUrl = 'data:image/png;base64,abc123';
    
    // 計算開始（完了を待たない）
    act(() => {
      result.current.handleStartCalculation(imageUrl);
    });
    
    // 計算中の状態を確認
    expect(result.current.isCalculating).toBe(true);
    expect(result.current.error).toBeNull();
    
    // 計算完了を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // 計算完了後の状態を確認
    expect(result.current.isCalculating).toBe(false);
  });
});
