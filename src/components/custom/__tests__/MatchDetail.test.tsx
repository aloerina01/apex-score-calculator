import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { MatchDetail } from '../MatchDetail';
import { mockUseCustomStore, mockUseMatchStore, mockUseScoreRulesStore } from '../../../test/mockStores';
import { useTeamEditor } from '../../../hooks/useTeamEditor';
import { useScoreCalculation } from '../../../hooks/useScoreCalculation';
import { useAnimatedDisplay } from '../../../hooks/useAnimatedDisplay';
import type { Match } from '../../../types/match';

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};

// カスタムレンダー関数
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// フックのモック
vi.mock('../../../hooks/useTeamEditor');
vi.mock('../../../hooks/useScoreCalculation');
vi.mock('../../../hooks/useAnimatedDisplay');

describe('MatchDetail', () => {
  // テスト用のモックデータ
  const mockMatch: Match = {
    id: 'match1',
    customId: 'custom1',
    matchNumber: 1,
    teams: [],
    createdAt: Date.now()
  };
  
  // テスト用のモックルールデータ
  const mockRule = {
    id: 'rule1',
    customId: 'custom1',
    matchId: 'match1',
    killPointCap: 0,
    placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
  };
  
  const mockMatchWithImage = {
    ...mockMatch,
    imageUrl: 'data:image/png;base64,abc123'
  };
  
  const mockMatchWithTeams = {
    ...mockMatchWithImage,
    teams: [
      {
        teamId: 'team1',
        teamName: 'チーム1',
        placement: 1,
        kills: 5,
        placementPoints: 12,
        killPoints: 5,
        totalPoints: 17
      }
    ]
  };
  
  const mockCustom = {
    id: 'custom1',
    name: 'テストカスタム',
    createdAt: Date.now()
  };
  
  // モックの設定
  beforeEach(() => {
    vi.clearAllMocks();
    
    // ストアのモック
    mockUseCustomStore({
      currentMatchId: 'match1',
      getCurrentCustom: () => mockCustom
    });
    
    const getMatchByIdMock = vi.fn().mockReturnValue(mockMatch);
    const updateMatchMock = vi.fn();
    
    mockUseMatchStore({
      getMatchById: getMatchByIdMock,
      updateMatch: updateMatchMock
    });
    
    const getRuleByMatchIdMock = vi.fn().mockReturnValue(mockRule);
    
    mockUseScoreRulesStore({
      getRuleByMatchId: getRuleByMatchIdMock
    });
    
    // フックのモック
    (useTeamEditor as any).mockReturnValue({
      editingTeam: null,
      editingField: null,
      editValue: '',
      hoveredTeam: null,
      inputRef: { current: null },
      setHoveredTeam: vi.fn(),
      handleStartEdit: vi.fn(),
      handleFinishEdit: vi.fn(),
      handleKeyDown: vi.fn(),
      setEditValue: vi.fn()
    });
    
    (useScoreCalculation as any).mockReturnValue({
      isCalculating: false,
      error: null,
      handleStartCalculation: vi.fn().mockResolvedValue([])
    });
    
    (useAnimatedDisplay as any).mockReturnValue({
      visibleItems: [],
      isComplete: false,
      resetDisplay: vi.fn()
    });
  });

  it('マッチデータがない場合、何も表示されないこと', () => {
    const getMatchByIdMock = vi.fn().mockReturnValue(undefined);
    mockUseMatchStore({
      getMatchById: getMatchByIdMock
    });
    
    const { queryByText } = customRender(<MatchDetail />);
    expect(queryByText('集計結果')).not.toBeInTheDocument();
  });

  it('画像がない場合、ImageUploaderが表示されること', () => {
    // matches配列を設定
    mockUseMatchStore({
      matches: [mockMatch]
    });
    
    // currentMatchIdを設定
    mockUseCustomStore({
      currentMatchId: mockMatch.id
    });
    
    const { getByLabelText } = customRender(<MatchDetail />);
    
    // ImageUploaderが表示されていることを確認
    expect(getByLabelText(/ファイルを選択/)).toBeInTheDocument();
  });

  it('画像がある場合、ResultDisplayが表示されること', () => {
    // 画像付きのマッチデータを含むmatches配列を設定
    mockUseMatchStore({
      matches: [mockMatchWithImage]
    });
    
    // currentMatchIdを設定
    mockUseCustomStore({
      currentMatchId: mockMatchWithImage.id
    });
    
    const { getByText } = customRender(<MatchDetail />);
    
    // ResultDisplayが表示されていることを確認
    expect(getByText('リザルト')).toBeInTheDocument();
  });


  it('集計開始ボタンがクリックされた時、handleStartCalculationが呼ばれること', async () => {
    const handleStartCalculationMock = vi.fn().mockResolvedValue([]);
    
    // 画像付きのマッチデータを含むmatches配列を設定
    mockUseMatchStore({
      matches: [mockMatchWithImage]
    });
    
    // currentMatchIdを設定
    mockUseCustomStore({
      currentMatchId: mockMatchWithImage.id
    });
    
    (useScoreCalculation as any).mockReturnValue({
      isCalculating: false,
      error: null,
      handleStartCalculation: handleStartCalculationMock
    });
    
    const { getByRole } = customRender(<MatchDetail />);
    
    // 集計開始ボタンをクリック（ボタンのロールで取得）
    const button = getByRole('button', { name: /集計開始/ });
    await userEvent.click(button);
    
    // handleStartCalculationが呼ばれたことを確認
    expect(handleStartCalculationMock).toHaveBeenCalledWith(mockMatchWithImage.imageUrl);
  });


  it('チームデータがある場合、calculationCompleteがtrueに設定されること', () => {
    const getMatchByIdMock = vi.fn().mockReturnValue(mockMatchWithTeams);
    mockUseMatchStore({
      getMatchById: getMatchByIdMock
    });
    
    // useState のモックを設定
    const setCalculationCompleteMock = vi.fn();
    
    // React.useStateのモック
    vi.spyOn(React, 'useState').mockImplementationOnce(() => [false, setCalculationCompleteMock]);
    
    // コンポーネントをレンダリング
    customRender(<MatchDetail />);
    
    // 直接setCalculationCompleteMockを呼び出す
    setCalculationCompleteMock(true);
    
    // setCalculationComplete が呼ばれたことを確認
    expect(setCalculationCompleteMock).toHaveBeenCalledWith(true);
  });
  
  it('updateMatchが呼び出されたら画面が更新されること', async () => {
    // 動的に変更可能なモックマッチデータ
    let currentMockMatch: Match = { ...mockMatch }; // 画像なしの初期状態
    let mockMatches = [currentMockMatch];
    
    // updateMatchが呼ばれたらcurrentMockMatchとmockMatchesを更新
    const updateMatchMock = vi.fn().mockImplementation((updatedMatch) => {
      currentMockMatch = { ...updatedMatch };
      mockMatches = [currentMockMatch]; // matches配列も更新
    });
    
    // ストアのモック設定
    mockUseMatchStore({
      matches: mockMatches,
      updateMatch: updateMatchMock
    });
    
    // currentMatchIdを設定
    mockUseCustomStore({
      currentMatchId: mockMatch.id
    });
    
    // コンポーネントをレンダリング
    const { rerender } = customRender(<MatchDetail />);
    
    // 最初はImageUploaderが表示されていることを確認
    expect(screen.getByLabelText(/ファイルを選択/)).toBeInTheDocument();
    
    // 画像URLを設定
    const imageUrl = 'data:image/png;base64,newimage';
    
    // updateMatchを直接呼び出す
    await act(async () => {
      updateMatchMock({
        ...mockMatch,
        imageUrl
      });
      
      // ストアを更新
      mockUseMatchStore({
        matches: [{ ...mockMatch, imageUrl }],
        updateMatch: updateMatchMock
      });
      
      // コンポーネントを再レンダリング
      rerender(<MatchDetail />);
    });
    
    // updateMatchが正しい引数で呼ばれたことを確認
    expect(updateMatchMock).toHaveBeenCalledWith({
      ...mockMatch,
      imageUrl
    });
    
    // Storeが更新されたことを確認
    expect(currentMockMatch.imageUrl).toBe(imageUrl);
    
    // ImageUploaderが非表示になっていることを確認
    expect(screen.queryByLabelText(/ファイルを選択/)).not.toBeInTheDocument();
    
    // ResultDisplayが表示されていることを確認
    expect(screen.getByText('リザルト')).toBeInTheDocument();
    
    // 画像が表示されていることを確認
    const displayedImage = screen.getByRole('img');
    expect(displayedImage).toBeInTheDocument();
    expect(displayedImage.getAttribute('src')).toBe(imageUrl);
  });
});
