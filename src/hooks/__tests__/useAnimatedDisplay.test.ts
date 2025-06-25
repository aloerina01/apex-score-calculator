import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useAnimatedDisplay } from '../useAnimatedDisplay';
import type { TeamScore } from '../../types/score';

describe('useAnimatedDisplay', () => {
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
    },
    {
      teamId: 'team3',
      teamName: 'チーム3',
      placement: 3,
      kills: 2,
      placementPoints: 7,
      killPoints: 2,
      totalPoints: 9
    }
  ];

  // タイマーのモック
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => 
      useAnimatedDisplay(mockTeams, false)
    );
    
    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it('enabledがfalseの場合、アイテムが表示されないこと', () => {
    const { result } = renderHook(() => 
      useAnimatedDisplay(mockTeams, false)
    );
    
    // タイマーを進める
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it('enabledがtrueの場合、アイテムが段階的に表示されること', () => {
    const { result } = renderHook(() => 
      useAnimatedDisplay(mockTeams, true, 100) // 100msごとに表示
    );
    
    // 最初は空
    expect(result.current.visibleItems).toEqual([]);
    
    // 1つ目のアイテムが表示される
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems.length).toBe(1);
    expect(result.current.visibleItems[0].teamId).toBe('team1');
    expect(result.current.isComplete).toBe(false);
    
    // 2つ目のアイテムが表示される
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems.length).toBe(2);
    expect(result.current.visibleItems[1].teamId).toBe('team2');
    expect(result.current.isComplete).toBe(false);
    
    // 3つ目のアイテムが表示される
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems.length).toBe(3);
    expect(result.current.visibleItems[2].teamId).toBe('team3');
    
    // 全アイテム表示後、もう一度タイマーを進めて完了状態を確認
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isComplete).toBe(true);
  });

  it('アイテムが順位順に表示されること', () => {
    // 順番がバラバラのデータ
    const unsortedTeams: TeamScore[] = [
      {
        teamId: 'team3',
        teamName: 'チーム3',
        placement: 3,
        kills: 2,
        placementPoints: 7,
        killPoints: 2,
        totalPoints: 9
      },
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
    
    const { result } = renderHook(() => 
      useAnimatedDisplay(unsortedTeams, true, 100)
    );
    
    // 1つ目のアイテムが表示される（順位1）
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems[0].teamId).toBe('team1');
    
    // 2つ目のアイテムが表示される（順位2）
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems[1].teamId).toBe('team2');
    
    // 3つ目のアイテムが表示される（順位3）
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.visibleItems[2].teamId).toBe('team3');
  });

  it('resetDisplayが正しく動作すること', () => {
    const { result } = renderHook(() => 
      useAnimatedDisplay(mockTeams, true, 100)
    );
    
    // いくつかのアイテムを表示
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.visibleItems.length).toBe(2);
    
    // リセット
    act(() => {
      result.current.resetDisplay();
    });
    
    // 状態がリセットされていることを確認
    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it('アイテムが空の場合、何も表示されないこと', () => {
    const { result } = renderHook(() => 
      useAnimatedDisplay([], true, 100)
    );
    
    // タイマーを進める
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it('依存配列が変更されたとき、表示がリセットされること', () => {
    const { result, rerender } = renderHook(
      ({ items, enabled }) => useAnimatedDisplay(items, enabled, 100),
      { initialProps: { items: mockTeams, enabled: true } }
    );
    
    // いくつかのアイテムを表示
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.visibleItems.length).toBe(2);
    
    // 新しいアイテムで再レンダリング
    const newTeams = [
      {
        teamId: 'team4',
        teamName: 'チーム4',
        placement: 1,
        kills: 10,
        placementPoints: 12,
        killPoints: 10,
        totalPoints: 22
      }
    ];
    
    rerender({ items: newTeams, enabled: true });
    
    // タイマーを進める
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // 新しいアイテムが表示されていることを確認
    expect(result.current.visibleItems.length).toBe(1);
    expect(result.current.visibleItems[0].teamId).toBe('team4');
  });
});
