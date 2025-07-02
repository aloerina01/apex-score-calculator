import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useTeamEditor } from '../useTeamEditor';
import type { ScoreRules, TeamScore } from '../../types/score';

describe('useTeamEditor', () => {
  // テスト用のモックデータ
  const mockTeams: TeamScore[] = [
    {
      teamId: 'team1',
      teamName: 'チーム1',
      placement: 1,
      kills: 5,
      placementPoints: 12,
      killPoints: 5,
      totalPoints: 17
    },
    {
      teamId: 'team2',
      teamName: 'チーム2',
      placement: 2,
      kills: 3,
      placementPoints: 9,
      killPoints: 3,
      totalPoints: 12
    }
  ];
  
  const mockRules: ScoreRules = {
    customId: 'custom1',
    matchId: 'match1',
    killPointCap: 0, // キルポイント上限なし
    placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
  };
  
  const mockOnTeamsUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, mockRules, mockOnTeamsUpdated)
    );
    
    expect(result.current.editingTeam).toBeNull();
    expect(result.current.editingField).toBeNull();
    expect(result.current.editValue).toBe('');
    expect(result.current.hoveredTeam).toBeNull();
  });

  it('チーム名の編集が正しく行われること', () => {
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, mockRules, mockOnTeamsUpdated)
    );
    
    // 編集開始
    act(() => {
      result.current.handleStartEdit('team1', 'teamName');
    });
    
    expect(result.current.editingTeam).toBe('team1');
    expect(result.current.editingField).toBe('teamName');
    expect(result.current.editValue).toBe('チーム1');
    
    // 値を変更
    act(() => {
      result.current.setEditValue('新チーム名');
    });
    
    expect(result.current.editValue).toBe('新チーム名');
    
    // 編集完了
    act(() => {
      result.current.handleFinishEdit();
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnTeamsUpdated).toHaveBeenCalledTimes(1);
    
    // 更新されたチームデータを確認
    const updatedTeams = mockOnTeamsUpdated.mock.calls[0][0];
    const updatedTeam = updatedTeams.find((t: TeamScore) => t.teamId === 'team1');
    expect(updatedTeam).toBeDefined();
    expect(updatedTeam?.teamName).toBe('新チーム名');
    
    // 編集状態がリセットされていることを確認
    expect(result.current.editingTeam).toBeNull();
    expect(result.current.editingField).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('キル数の編集が正しく行われ、ポイントが再計算されること', () => {
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, mockRules, mockOnTeamsUpdated)
    );
    
    // 編集開始
    act(() => {
      result.current.handleStartEdit('team1', 'kills');
    });
    
    expect(result.current.editingTeam).toBe('team1');
    expect(result.current.editingField).toBe('kills');
    expect(result.current.editValue).toBe('5');
    
    // 値を変更
    act(() => {
      result.current.setEditValue('10');
    });
    
    // 編集完了
    act(() => {
      result.current.handleFinishEdit();
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnTeamsUpdated).toHaveBeenCalledTimes(1);
    
    // 更新されたチームデータを確認
    const updatedTeams = mockOnTeamsUpdated.mock.calls[0][0];
    const updatedTeam = updatedTeams.find((t: TeamScore) => t.teamId === 'team1');
    expect(updatedTeam).toBeDefined();
    expect(updatedTeam?.kills).toBe(10);
    expect(updatedTeam?.killPoints).toBe(10); // キルポイント上限なしの場合
    expect(updatedTeam?.totalPoints).toBe(22); // 12(順位ポイント) + 10(キルポイント)
  });

  it('キルポイント上限がある場合、キルポイントが正しく計算されること', () => {
    const rulesWithCap: ScoreRules = {
      ...mockRules,
      killPointCap: 5 // キルポイント上限5
    };
    
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, rulesWithCap, mockOnTeamsUpdated)
    );
    
    // 編集開始
    act(() => {
      result.current.handleStartEdit('team1', 'kills');
    });
    
    // 値を変更
    act(() => {
      result.current.setEditValue('10');
    });
    
    // 編集完了
    act(() => {
      result.current.handleFinishEdit();
    });
    
    // 更新されたチームデータを確認
    const updatedTeams = mockOnTeamsUpdated.mock.calls[0][0];
    const updatedTeam = updatedTeams.find((t: TeamScore) => t.teamId === 'team1');
    expect(updatedTeam).toBeDefined();
    expect(updatedTeam?.kills).toBe(10);
    expect(updatedTeam?.killPoints).toBe(5); // キルポイント上限5の場合
    expect(updatedTeam?.totalPoints).toBe(17); // 12(順位ポイント) + 5(キルポイント)
  });

  it('Escapeキーを押すと編集がキャンセルされること', () => {
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, mockRules, mockOnTeamsUpdated)
    );
    
    // 編集開始
    act(() => {
      result.current.handleStartEdit('team1', 'teamName');
    });
    
    // 値を変更
    act(() => {
      result.current.setEditValue('新チーム名');
    });
    
    // Escapeキーを押す
    act(() => {
      result.current.handleKeyDown({ key: 'Escape' } as React.KeyboardEvent);
    });
    
    // 編集状態がリセットされていることを確認
    expect(result.current.editingTeam).toBeNull();
    expect(result.current.editingField).toBeNull();
    expect(result.current.editValue).toBe('');
    
    // コールバックが呼ばれていないことを確認
    expect(mockOnTeamsUpdated).not.toHaveBeenCalled();
  });

  it('Enterキーを押すと編集が完了すること', () => {
    const { result } = renderHook(() => 
      useTeamEditor(mockTeams, mockRules, mockOnTeamsUpdated)
    );
    
    // 編集開始
    act(() => {
      result.current.handleStartEdit('team1', 'teamName');
    });
    
    // 値を変更
    act(() => {
      result.current.setEditValue('新チーム名');
    });
    
    // Enterキーを押す
    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent);
    });
    
    // コールバックが呼ばれたことを確認
    expect(mockOnTeamsUpdated).toHaveBeenCalledTimes(1);
    
    // 編集状態がリセットされていることを確認
    expect(result.current.editingTeam).toBeNull();
    expect(result.current.editingField).toBeNull();
    expect(result.current.editValue).toBe('');
  });
});
