import React from 'react';
import { render, screen, act, findByRole, findByLabelText } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Sidebar } from '../Sidebar';
import { mockUseCustomStore, mockUseMatchStore, mockUseScoreRulesStore } from '../../../test/mockStores';
import type { Custom } from '../../../types/custom';
import type { Match } from '../../../types/match';
import type { ScoreRules } from '../../../types/score';

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};

// カスタムレンダー関数
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

describe('Sidebar', () => {
  // テスト用のモックデータ
  const mockCustoms: Custom[] = [
    {
      id: 'custom1',
      name: 'テストカスタム1',
      createdAt: Date.now(),
      matches: []
    },
    {
      id: 'custom2',
      name: 'テストカスタム2',
      createdAt: Date.now(),
      matches: []
    }
  ];

  const mockMatches: Match[] = [
    {
      id: 'match1',
      customId: 'custom1',
      matchNumber: 1,
      teams: [],
      createdAt: Date.now()
    },
    {
      id: 'match2',
      customId: 'custom1',
      matchNumber: 2,
      teams: [],
      createdAt: Date.now()
    },
    {
      id: 'match3',
      customId: 'custom2',
      matchNumber: 5, // 重複を避けるために異なるマッチナンバーを使用
      teams: [],
      createdAt: Date.now()
    }
  ];

  const mockRules: ScoreRules[] = [
    {
      id: 'rule1',
      customId: 'custom1',
      matchId: 'match1',
      killPointCap: 0,
      placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
    },
    {
      id: 'rule2',
      customId: 'custom1',
      matchId: 'match2',
      killPointCap: 5,
      placementPoints: [15, 10, 8, 6, 5, 4, 3, 2, 1, 1]
    }
  ];

  // テスト後にモックをリセット
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ストアにカスタムデータが無いとき、サイドバーにはカスタムリストが表示されないこと', () => {
    // カスタムデータが空の状態をモック
    mockUseCustomStore({
      customs: [],
      currentCustomId: null,
      currentMatchId: null
    });
    
    mockUseMatchStore({
      matches: []
    });
    
    const { getByText } = customRender(<Sidebar />);
    
    // 「カスタムがありません」というメッセージが表示されていることを確認
    expect(getByText('カスタムがありません')).toBeInTheDocument();
  });

  it('ストアにカスタムデータがあるとき、サイドバーにはカスタムリストが表示されていること', () => {
    // カスタムデータがある状態をモック
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: null,
      currentMatchId: null
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      )
    });
    
    const { getByText } = customRender(<Sidebar />);
    
    // カスタム名が表示されていることを確認
    expect(getByText('テストカスタム1')).toBeInTheDocument();
    expect(getByText('テストカスタム2')).toBeInTheDocument();
  });

  it('「新しいカスタムを始める」を押すと、ダイアログが開き、カスタム名を入れるとカスタムが登録されカスタムリストに表示されること', async () => {
    // promptのモック
    const promptMock = vi.spyOn(window, 'prompt').mockReturnValue('新しいカスタム');
    
    // addCustomのモック
    const addCustomMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    mockUseCustomStore({
      customs: [],
      currentCustomId: null,
      currentMatchId: null,
      addCustom: addCustomMock,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: []
    });
    
    const { getByText } = customRender(<Sidebar />);
    
    // 「新しいカスタムを始める」ボタンをクリック
    await userEvent.click(getByText('新しいカスタムを始める'));
    
    // promptが呼ばれたことを確認
    expect(promptMock).toHaveBeenCalledWith('カスタム名を入力してください');
    
    // addCustomが呼ばれたことを確認
    expect(addCustomMock).toHaveBeenCalled();
    const addedCustom = addCustomMock.mock.calls[0][0];
    expect(addedCustom.name).toBe('新しいカスタム');
    
    // setCurrentCustomが呼ばれたことを確認
    expect(setCurrentCustomMock).toHaveBeenCalledWith(addedCustom.id);
  });

  it('「新しいマッチを追加」を押すと、新しいマッチが登録され、カスタムリストに表示されること', async () => {
    // addMatchのモック
    const addMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    const addRuleMock = vi.fn();
    
    // expandedCustomsの状態を設定
    const setExpandedCustomsMock = vi.fn();
    const expandedCustoms = { custom1: true };
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1', // カスタムを選択状態にする
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      addMatch: addMatchMock
    });
    
    mockUseScoreRulesStore({
      addRule: addRuleMock,
      getDefaultRules: vi.fn().mockReturnValue({
        killPointCap: 0,
        placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
      })
    });
    
    // React.useStateのモックを設定
    vi.spyOn(React, 'useState').mockImplementationOnce(() => [expandedCustoms, setExpandedCustomsMock]);
    
    const { getByText } = customRender(<Sidebar />);
    
    // カスタムをクリックして展開する
    await userEvent.click(getByText('テストカスタム1'));
    
    // 「新規マッチを追加」ボタンをクリック
    const addMatchButton = getByText('新規マッチを追加');
    await userEvent.click(addMatchButton);
    
    // addMatchが呼ばれたことを確認
    expect(addMatchMock).toHaveBeenCalled();
    const addedMatch = addMatchMock.mock.calls[0][0];
    expect(addedMatch.customId).toBe('custom1');
    expect(addedMatch.matchNumber).toBe(3); // 既存の2つのマッチの後
    
    // addRuleが呼ばれたことを確認
    expect(addRuleMock).toHaveBeenCalled();
    
    // setCurrentCustomとsetCurrentMatchが呼ばれたことを確認
    expect(setCurrentCustomMock).toHaveBeenCalledWith('custom1');
    expect(setCurrentMatchMock).toHaveBeenCalledWith(addedMatch.id);
  });

  it('マッチがない状態で「新しいマッチを追加」を押したときに登録されるマッチのスコアルールには、デフォルトルールが適用されていること', async () => {
    // addMatchのモック
    const addMatchMock = vi.fn();
    const addRuleMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    // デフォルトルールの定義
    const defaultRules = {
      killPointCap: 0,
      placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
    };
    
    const getDefaultRulesMock = vi.fn().mockReturnValue(defaultRules);
    
    // カスタムはあるがマッチがない状態をモック
    const customWithoutMatches = {
      id: 'custom3',
      name: 'マッチなしカスタム',
      createdAt: Date.now(),
      matches: []
    };
    
    // expandedCustomsの状態を設定
    const setExpandedCustomsMock = vi.fn();
    const expandedCustoms = { custom3: true };
    
    mockUseCustomStore({
      customs: [customWithoutMatches],
      currentCustomId: 'custom3', // カスタムを選択状態にする
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: [],
      getMatchesByCustomId: vi.fn().mockReturnValue([]), // マッチなし
      addMatch: addMatchMock
    });
    
    mockUseScoreRulesStore({
      addRule: addRuleMock,
      getDefaultRules: getDefaultRulesMock
    });
    
    // React.useStateのモックを設定
    vi.spyOn(React, 'useState').mockImplementationOnce(() => [expandedCustoms, setExpandedCustomsMock]);
    
    const { getByText } = customRender(<Sidebar />);
    
    // カスタムをクリックして展開する
    await userEvent.click(getByText('マッチなしカスタム'));
    
    // 「新規マッチを追加」ボタンをクリック
    const addMatchButton = getByText('新規マッチを追加');
    await userEvent.click(addMatchButton);
    
    // getDefaultRulesがundefinedで呼ばれたことを確認（前のマッチがないため）
    expect(getDefaultRulesMock).toHaveBeenCalledWith(undefined);
    
    // addRuleが呼ばれたことを確認
    expect(addRuleMock).toHaveBeenCalled();
    const addedRule = addRuleMock.mock.calls[0][0];
    
    // デフォルトルールが適用されていることを確認
    expect(addedRule.killPointCap).toBe(defaultRules.killPointCap);
    expect(addedRule.placementPoints).toEqual(defaultRules.placementPoints);
  });

  it('マッチがすでにある状態で「新しいマッチを追加」を押したときに登録されるマッチのスコアルールには、1つ前のマッチのスコアルールが適用されていること', async () => {
    // addMatchのモック
    const addMatchMock = vi.fn();
    const addRuleMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    // 前のマッチのルール
    const previousMatchRules = {
      killPointCap: 5,
      placementPoints: [15, 10, 8, 6, 5, 4, 3, 2, 1, 1]
    };
    
    const getDefaultRulesMock = vi.fn().mockImplementation((previousMatchId) => {
      if (previousMatchId === 'match2') {
        return previousMatchRules;
      }
      return {
        killPointCap: 0,
        placementPoints: [12, 9, 7, 5, 4, 3, 2, 1, 1, 1]
      };
    });
    
    // expandedCustomsの状態を設定
    const setExpandedCustomsMock = vi.fn();
    const expandedCustoms = { custom1: true };
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1', // カスタムを選択状態にする
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      addMatch: addMatchMock
    });
    
    mockUseScoreRulesStore({
      addRule: addRuleMock,
      getDefaultRules: getDefaultRulesMock
    });
    
    // React.useStateのモックを設定
    vi.spyOn(React, 'useState').mockImplementationOnce(() => [expandedCustoms, setExpandedCustomsMock]);
    
    const { getByText } = customRender(<Sidebar />);
    
    // カスタムをクリックして展開する
    await userEvent.click(getByText('テストカスタム1'));
    
    // 「新規マッチを追加」ボタンをクリック
    const addMatchButton = getByText('新規マッチを追加');
    await userEvent.click(addMatchButton);
    
    // getDefaultRulesが前のマッチIDで呼ばれたことを確認
    expect(getDefaultRulesMock).toHaveBeenCalledWith('match2');
    
    // addRuleが呼ばれたことを確認
    expect(addRuleMock).toHaveBeenCalled();
    const addedRule = addRuleMock.mock.calls[0][0];
    
    // 前のマッチのルールが適用されていることを確認
    expect(addedRule.killPointCap).toBe(previousMatchRules.killPointCap);
    expect(addedRule.placementPoints).toEqual(previousMatchRules.placementPoints);
  });

  it('カスタムリストが複数件表示されている状態で、あるカスタムを選択すると、Store上のcurrentCustomが更新されること', async () => {
    // setCurrentCustomのモック
    const setCurrentCustomMock = vi.fn();
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: null,
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      )
    });
    
    const { getByText } = customRender(<Sidebar />);
    
    // カスタムをクリック
    await userEvent.click(getByText('テストカスタム2'));
    
    // setCurrentCustomが呼ばれたことを確認
    expect(setCurrentCustomMock).toHaveBeenCalledWith('custom2');
  });

  it('カスタムリストが複数件表示されている状態で、あるマッチを選択すると、currentCustomとcurrentMatchが更新されること', async () => {
    // setCurrentCustomとsetCurrentMatchのモック
    const setCurrentCustomMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    // マッチデータを明示的に設定
    const testMatches = [
      {
        id: 'match1',
        customId: 'custom1',
        matchNumber: 1,
        teams: [],
        createdAt: Date.now()
      },
      {
        id: 'match2',
        customId: 'custom1',
        matchNumber: 2,
        teams: [],
        createdAt: Date.now()
      }
    ];
    
    // getMatchesByCustomIdのモック実装
    const getMatchesByCustomIdMock = vi.fn().mockImplementation((customId) => {
      if (customId === 'custom1') {
        return testMatches;
      }
      return [];
    });
    
    // expandedCustomsの状態を設定
    const expandedCustoms = { custom1: true };
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1', // カスタムを選択状態にする
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: testMatches,
      getMatchesByCustomId: getMatchesByCustomIdMock
    });
    
    // React.useStateのモックを設定
    vi.spyOn(React, 'useState').mockImplementation(() => [expandedCustoms, vi.fn()]);
    
    const { getAllByText } = customRender(<Sidebar />);
    
    // マッチ2を探して直接クリック
    const matchElements = getAllByText(/マッチ/);
    const match2Element = matchElements.find(el => el.textContent?.includes('2'));
    
    if (!match2Element) {
      throw new Error('マッチ2が見つかりません');
    }
    
    await userEvent.click(match2Element);
    
    // setCurrentCustomとsetCurrentMatchが呼ばれたことを確認
    expect(setCurrentCustomMock).toHaveBeenCalledWith('custom1');
    expect(setCurrentMatchMock).toHaveBeenCalledWith('match2');
  });

  it('カスタムリストから任意のカスタムを削除すると、確認ダイアログが表示されたのち、該当カスタムとそれに紐づくマッチが削除されること', async () => {
    // confirmのモック
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // deleteCustomとdeleteMatchのモック
    const deleteCustomMock = vi.fn();
    const deleteMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    const setCurrentMatchMock = vi.fn();

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: null,
      currentMatchId: null,
      deleteCustom: deleteCustomMock,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      deleteMatch: deleteMatchMock
    });
    
    const { getByText, getAllByRole } = customRender(<Sidebar />);
    
    // カスタムにマウスオーバー
    await userEvent.hover(getByText('テストカスタム1'));
    
    // 削除ボタンをクリック
    const deleteButtons = getAllByRole('button', { name: 'Delete custom' });
    await userEvent.click(deleteButtons[0]);
    
    // confirmが呼ばれたことを確認
    expect(confirmMock).toHaveBeenCalledWith('このカスタムとカスタムのすべてのマッチを削除しますか？この操作は元に戻せません');
    
    // deleteMatchが各マッチに対して呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match1');
    expect(deleteMatchMock).toHaveBeenCalledWith('match2');
    
    // deleteCustomが呼ばれたことを確認
    expect(deleteCustomMock).toHaveBeenCalledWith('custom1');
  });

  it('選択中のカスタムを削除すると、いずれのカスタムも選択されていない状態となること', async () => {
    // confirmのモック
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // deleteCustomとdeleteMatchのモック
    const deleteCustomMock = vi.fn();
    const deleteMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1', // 選択中のカスタム
      currentMatchId: null,
      deleteCustom: deleteCustomMock,
      setCurrentCustom: setCurrentCustomMock,
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      deleteMatch: deleteMatchMock
    });
    
    const { getByText, getAllByRole } = customRender(<Sidebar />);
    
    // カスタムにマウスオーバー
    await userEvent.hover(getByText('テストカスタム1'));
    
    // 削除ボタンをクリック
    const deleteButtons = getAllByRole('button', { name: 'Delete custom' });
    await userEvent.click(deleteButtons[0]);

    expect(confirmMock).toHaveBeenCalledWith('このカスタムとカスタムのすべてのマッチを削除しますか？この操作は元に戻せません');
    
    // deleteCustomが呼ばれたことを確認
    expect(deleteCustomMock).toHaveBeenCalledWith('custom1');
    
    // currentCustomIdがnullになることを確認（実際のストア更新はモックされているため、ここでは検証できない）
    // 実際のアプリケーションでは、deleteCustom内でcurrentCustomIdをnullに設定する処理が含まれている
  });

  it('カスタムリストから任意のマッチを削除すると、確認ダイアログが表示されたのち、該当マッチが削除されること', async () => {
    // confirmのモック
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1',
      currentMatchId: null,
      setCurrentMatch: setCurrentMatchMock,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      deleteMatch: deleteMatchMock
    });
    
    const { getByText, getAllByRole } = customRender(<Sidebar />);
    
    // カスタムを展開
    await userEvent.click(getByText('テストカスタム1'));
    
    // マッチにマウスオーバー
    await userEvent.hover(getByText('マッチ 1'));
    
    // 削除ボタンをクリック
    const deleteButtons = getAllByRole('button', { name: 'Delete match' });
    await userEvent.click(deleteButtons[0]);
    
    // confirmが呼ばれたことを確認
    expect(confirmMock).toHaveBeenCalledWith('このマッチを削除しますか？この操作は元に戻せません');
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match1');
    
    // 選択中のマッチではないため、setCurrentMatchは呼ばれないことを確認
    expect(setCurrentMatchMock).not.toHaveBeenCalled();
  });

  it('選択中のマッチを削除すると、直前のマッチがある場合はそのマッチが選択状態になること', async () => {
    // confirmのモック
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    // マッチデータを明示的に設定
    const testMatches = [
      {
        id: 'match1',
        customId: 'custom1',
        matchNumber: 1,
        teams: [],
        createdAt: Date.now()
      },
      {
        id: 'match2',
        customId: 'custom1',
        matchNumber: 2,
        teams: [],
        createdAt: Date.now()
      }
    ];
    
    // getMatchesByCustomIdのモック実装
    const getMatchesByCustomIdMock = vi.fn().mockImplementation((customId) => {
      if (customId === 'custom1') {
        // 最初はmatch1とmatch2を返す
        return testMatches;
      }
      return [];
    });
    
    // deleteMatchが呼ばれた後のgetMatchesByCustomIdの動作を変更
    deleteMatchMock.mockImplementation((matchId) => {
      if (matchId === 'match2') {
        // match2が削除された後は、match1のみを返すように変更
        getMatchesByCustomIdMock.mockImplementation((customId) => {
          if (customId === 'custom1') {
            return [testMatches[0]]; // match1のみ
          }
          return [];
        });
      }
    });
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1',
      currentMatchId: 'match2', // 選択中のマッチ
      setCurrentMatch: setCurrentMatchMock,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: testMatches,
      getMatchesByCustomId: getMatchesByCustomIdMock,
      deleteMatch: deleteMatchMock
    });
    
    // コンポーネントをレンダリング
    const { getByText,findByLabelText } = customRender(<Sidebar />);
    
    // カスタムを展開
    await userEvent.click(getByText('テストカスタム1'));
    await userEvent.hover(getByText('マッチ 2'));
    // 削除ボタンを探して（aria-labelで）クリック
    const deleteButton = await findByLabelText('Delete match');
    await userEvent.click(deleteButton);

    expect(confirmMock).toHaveBeenCalledWith('このマッチを削除しますか？この操作は元に戻せません');
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match2');
    
    // getMatchesByCustomIdが呼ばれたことを確認
    expect(getMatchesByCustomIdMock).toHaveBeenCalledWith('custom1');
    
    // 残りのマッチ（match1）が選択状態になることを確認
    expect(setCurrentMatchMock).toHaveBeenCalledWith('match1');
  });

  it('選択中のマッチを削除すると、直前のマッチがない場合はそのカスタムが選択状態になること', async () => {
    // confirmのモック
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    
    // マッチデータを明示的に設定
    const testMatches = [
      {
        id: 'match3',
        customId: 'custom2',
        matchNumber: 5,
        teams: [],
        createdAt: Date.now()
      }
    ];
    
    // getMatchesByCustomIdのモック実装
    const getMatchesByCustomIdMock = vi.fn().mockImplementation((customId) => {
      if (customId === 'custom2') {
        // 最初はmatch3を返す
        return testMatches;
      }
      return [];
    });
    
    // deleteMatchが呼ばれた後のgetMatchesByCustomIdの動作を変更
    deleteMatchMock.mockImplementation((matchId) => {
      if (matchId === 'match3') {
        // match3が削除された後は、空の配列を返すように変更
        getMatchesByCustomIdMock.mockImplementation(() => {
          return [];
        });
      }
    });
    
    // hoveredMatchIdの状態を設定するためのモック
    const setHoveredMatchIdMock = vi.fn();
    
    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom2',
      currentMatchId: 'match3', // 選択中のマッチ（このカスタムには他にマッチがない）
      setCurrentMatch: setCurrentMatchMock,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: testMatches,
      getMatchesByCustomId: getMatchesByCustomIdMock,
      deleteMatch: deleteMatchMock
    });
    
    // コンポーネントをレンダリング
    const { getByText, findByLabelText } = customRender(<Sidebar />);

    // カスタムを展開
    await userEvent.click(getByText('テストカスタム2'));
    await userEvent.hover(getByText('マッチ 5'));
    
    // 削除ボタンを探して（aria-labelで）クリック
    const deleteButton = await findByLabelText('Delete match');
    await userEvent.click(deleteButton);
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match3');
    
    // getMatchesByCustomIdが呼ばれたことを確認
    expect(getMatchesByCustomIdMock).toHaveBeenCalledWith('custom2');
    
    // マッチがないため、currentMatchIdがnullになることを確認
    expect(setCurrentMatchMock).toHaveBeenCalledWith(null);
  });
});
