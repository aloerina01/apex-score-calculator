import React from 'react';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Sidebar } from '../Sidebar';
import { mockUseCustomStore, mockUseMatchStore, mockUseScoreRulesStore, mockUseDialogStore } from '../../../test/mockStores';
import type { Custom } from '../../../types/custom';
import type { Match } from '../../../types/match';

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

  it('「新しいカスタムを始める」を押すとカスタム作成ダイアログが開くこと', async () => {
    // ダイアログストアのモック
    const openDialogMock = vi.fn();
    
    mockUseDialogStore({
      openDialog: openDialogMock
    });
    
    mockUseCustomStore({
      customs: [],
      currentCustomId: null,
      currentMatchId: null
    });
    
    mockUseMatchStore({
      matches: []
    });
    
    const { getByText } = customRender(<Sidebar />);
    
    // 「新しいカスタムを始める」ボタンをクリック
    await userEvent.click(getByText('新しいカスタムを始める'));
    
    // ダイアログが開かれたことを確認
    expect(openDialogMock).toHaveBeenCalled();
    
    // ダイアログの設定を確認
    const dialogKey = openDialogMock.mock.calls[0][0];
    const dialogConfig = openDialogMock.mock.calls[0][1];
    
    expect(dialogKey).toContain('create-custom');
    expect(dialogConfig.title).toBe("カスタム作成");
    expect(dialogConfig.confirmText).toBe("作成");
    expect(dialogConfig.cancelText).toBe("キャンセル");
    expect(dialogConfig.showCancel).toBe(true);
    expect(dialogConfig.isValid).toBe(false); // 初期状態では無効
  });
  
  it('カスタム作成ダイアログに、カスタム名を1文字以上入力すると「作成」ボタンが押せるようになること', async () => {
    // setDialogConfigのモック
    const setDialogConfigMock = vi.fn();
    
    // ダイアログキーを固定値に設定
    const dialogKey = 'create-custom-dialog-key';
    
    // useDialogStoreのモック
    // openDialogが呼ばれたときに、openedDialogKeyとconfigsを設定するように実装
    let configs: Record<string, any> = {};
    
    const openDialogMock = vi.fn((key, config) => {
      configs[key] = config;
      
      // モックを更新して、ダイアログが表示されるようにする
      mockUseDialogStore({
        openedDialogKey: key,
        configs: { ...configs },
        openDialog: openDialogMock,
        setDialogConfig: setDialogConfigMock
      });
    });
    
    mockUseDialogStore({
      openedDialogKey: null,
      configs: {},
      openDialog: openDialogMock,
      setDialogConfig: setDialogConfigMock
    });
    
    mockUseCustomStore({
      customs: [],
      currentCustomId: null,
      currentMatchId: null
    });
    
    // generateDialogKeyのモックを追加
    vi.spyOn(React, 'useMemo').mockImplementation(() => dialogKey);
    
    // コンポーネントをレンダリング
    const { getByText, getByPlaceholderText, rerender } = customRender(<Sidebar />);
    
    // 「新しいカスタムを始める」ボタンをクリック
    await userEvent.click(getByText('新しいカスタムを始める'));
    
    // openDialogが呼ばれたことを確認
    expect(openDialogMock).toHaveBeenCalled();
    
    // コンポーネントを再レンダリングして、ダイアログが表示されるようにする
    rerender(<Sidebar />);
    
    // カスタム名の入力フィールドを取得
    const inputField = getByPlaceholderText('カスタム名');
    
    // 入力フィールドに値を入力
    await userEvent.type(inputField, 'テストカスタム');
    
    // setDialogConfigが適切に呼ばれたことを確認
    expect(setDialogConfigMock).toHaveBeenCalledWith(
      expect.any(String), // ダイアログキー（実際の値は動的に生成されるため、任意の文字列であることを確認）
      { isValid: true }   // 入力があるので有効
    );
  });
  
  it('addCustomを呼び出すと、追加されたカスタムがリストに表示されること', async () => {
    // カスタムの状態を保持する配列
    const mockCustoms: Custom[] = [];
    
    // addCustomのモック
    const addCustomMock = vi.fn((custom) => {
      // addCustomが呼ばれたら、customsの状態を更新するモック
      mockCustoms.push(custom);
    });
    
    // 最初は空のカスタムリスト
    mockUseCustomStore({
      customs: mockCustoms, // 最初は空の配列
      currentCustomId: null,
      currentMatchId: null,
      addCustom: addCustomMock
    });
    
    const { getByText, queryByText, rerender } = customRender(<Sidebar />);
    
    // 最初は「カスタムがありません」と表示されていることを確認
    expect(getByText('カスタムがありません')).toBeInTheDocument();
    
    // 新しいカスタムを作成
    const customName = 'テストカスタム';
    const newCustom: Custom = {
      id: `custom_${Date.now()}`,
      name: customName,
      createdAt: Date.now(),
      matches: [],
    };
    
    // addCustomを直接呼び出す
    addCustomMock(newCustom);
    
    // カスタムが追加されたので、useCustomStoreの返す値を更新
    mockUseCustomStore({
      customs: mockCustoms, // addCustomMockによって更新された配列
      currentCustomId: null,
      currentMatchId: null,
      addCustom: addCustomMock
    });
    
    // コンポーネントを再レンダリング
    // これは実際のアプリケーションでは自動的に行われますが、
    // テスト環境では明示的に行う必要があります
    rerender(<Sidebar />);
    
    // 「カスタムがありません」のメッセージが表示されなくなったことを確認
    expect(queryByText('カスタムがありません')).not.toBeInTheDocument();
    
    // 追加されたカスタム名が表示されていることを確認
    expect(getByText(customName)).toBeInTheDocument();
  });

  it('setCurrentCustomを呼び出すと、該当のカスタムが選択状態になること', async () => {
    // カスタムデータ
    const testCustoms: Custom[] = [
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
    
    // setCurrentCustomのモック
    const setCurrentCustomMock = vi.fn();
    
    // 最初はカスタムが選択されていない状態
    mockUseCustomStore({
      customs: testCustoms,
      currentCustomId: null,
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock
    });
    
    mockUseMatchStore({
      matches: [],
      getMatchesByCustomId: vi.fn().mockImplementation(() => [])
    });
    
    const { getByText, rerender } = customRender(<Sidebar />);
    
    // カスタム名が表示されていることを確認
    expect(getByText('テストカスタム1')).toBeInTheDocument();
    expect(getByText('テストカスタム2')).toBeInTheDocument();
    
    // setCurrentCustomを直接呼び出す
    setCurrentCustomMock('custom1');
    
    // カスタムが選択されたので、useCustomStoreの返す値を更新
    mockUseCustomStore({
      customs: testCustoms,
      currentCustomId: 'custom1', // カスタム1が選択状態
      currentMatchId: null,
      setCurrentCustom: setCurrentCustomMock
    });
    
    // コンポーネントを再レンダリング
    rerender(<Sidebar />);
    
    // カスタム1が選択状態になっていることを確認
    // 選択状態のスタイルをチェックする方法として、
    // 背景色が透明でないことを確認する
    const selectedCustomElement = getByText('テストカスタム1').closest('div');
    expect(selectedCustomElement).toHaveStyle('background: var(--chakra-colors-blue-100)'); // 選択状態の背景色が設定されていることを確認
    
    // 他のカスタムは選択状態ではないことを確認
    const nonSelectedCustomElement = getByText('テストカスタム2').closest('div');
    expect(nonSelectedCustomElement).toHaveStyle('background: var(--chakra-colors-transparent)');
  });

  it('「新しいマッチを追加」を押すと、addCustomとsetCurrentCustomが呼び出されること', async () => {
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

  it('カスタムリストから任意のカスタムの削除ボタンを押すと、確認ダイアログが表示されること', async () => {
    // openDialogのモック
    const openDialogMock = vi.fn();
    
    // ダイアログキーを固定値に設定
    const dialogKey = 'delete-custom-dialog-key';
    
    // useDialogStoreのモック
    mockUseDialogStore({
      openDialog: openDialogMock,
    });

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

    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    vi.spyOn(React, 'useMemo').mockImplementation(() => dialogKey);
    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    
    const { getByText, getAllByRole } = customRender(<Sidebar />);
    
    // カスタムにマウスオーバー
    await userEvent.hover(getByText('テストカスタム1'));
    
    // 削除ボタンをクリック
    const deleteButtons = getAllByRole('button', { name: 'Delete custom' });
    await userEvent.click(deleteButtons[0]);
    
    // openDialogが呼ばれたことを確認
    expect(openDialogMock).toHaveBeenCalled();
    
    // ダイアログの設定を確認
    const calledDialogKey = openDialogMock.mock.calls[0][0];
    const dialogConfig = openDialogMock.mock.calls[0][1];
    
    expect(calledDialogKey).toContain('delete-custom');
    expect(dialogConfig.title).toBe("カスタム削除の確認");
    expect(dialogConfig.confirmText).toBe("削除");
    expect(dialogConfig.cancelText).toBe("キャンセル");
    expect(dialogConfig.showCancel).toBe(true);
    expect(dialogConfig.onConfirm).toBeDefined();
  });

  it('未選択カスタムの削除を実行すると、該当カスタムとそれに紐づくマッチが削除されること', async () => {
    // deleteCustomとdeleteMatchのモック
    const deleteCustomMock = vi.fn();
    const deleteMatchMock = vi.fn();
    const setCurrentCustomMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    // ダイアログキーを固定値に設定
    const dialogKey = 'delete-custom-dialog-key';
    
    // useDialogStoreのモック
    const { getSavedOnConfirm } = mockUseDialogStore();
    const onConfirm = getSavedOnConfirm();

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: null, // 未選択状態
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
    
    // React.useMemoのモックを設定
    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    vi.spyOn(React, 'useMemo').mockImplementation(() => dialogKey);
    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    
    // const { getByText, getAllByRole } = 
    customRender(<Sidebar />);
    act(() => {
      if (onConfirm) {
        console.log('onConfirm', onConfirm);
        onConfirm(); // ダイアログの確認をシミュレート
      }
    })
    // // カスタムにマウスオーバー
    // await userEvent.hover(getByText('テストカスタム1'));
    
    // // 削除ボタンをクリック
    // const deleteButtons = getAllByRole('button', { name: 'Delete custom' });
    // await userEvent.click(deleteButtons[0]);
    
    // deleteMatchが各マッチに対して呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match1');
    expect(deleteMatchMock).toHaveBeenCalledWith('match2');
    // deleteCustomが呼ばれたことを確認
    expect(deleteCustomMock).toHaveBeenCalledWith('custom1');
    
    // setCurrentCustomとsetCurrentMatchがnullで呼ばれたことを確認
    expect(setCurrentCustomMock).toHaveBeenCalledWith(null);
    expect(setCurrentMatchMock).toHaveBeenCalledWith(null);
  });

  it('選択中のカスタムの削除を実行すると、いずれのカスタムも選択されていない状態となること', async () => {
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
    
    expect(setCurrentCustomMock).toHaveBeenCalledWith(null);
    expect(setCurrentMatchMock).toHaveBeenCalledWith(null);
  });

  it('カスタムリストから任意のマッチの削除ボタンを押すと、確認ダイアログが表示されること', async () => {
    // openDialogのモック
    const openDialogMock = vi.fn();
    
    // ダイアログキーを固定値に設定
    const dialogKey = 'delete-match-dialog-key';
    
    // useDialogStoreのモック
    mockUseDialogStore({
      openDialog: openDialogMock,
    });

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1',
      currentMatchId: null
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      )
    });

    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    vi.spyOn(React, 'useMemo').mockImplementation(() => null);
    vi.spyOn(React, 'useMemo').mockImplementation(() => dialogKey);
    
    const { getByText, getAllByRole } = customRender(<Sidebar />);
    
    // カスタムを展開
    await userEvent.click(getByText('テストカスタム1'));
    
    // マッチにマウスオーバー
    await userEvent.hover(getByText('マッチ 1'));
    
    // 削除ボタンをクリック
    const deleteButtons = getAllByRole('button', { name: 'Delete match' });
    await userEvent.click(deleteButtons[0]);
    
    // openDialogが呼ばれたことを確認
    expect(openDialogMock).toHaveBeenCalled();
    
    // ダイアログの設定を確認
    const calledDialogKey = openDialogMock.mock.calls[0][0];
    const dialogConfig = openDialogMock.mock.calls[0][1];
    
    expect(calledDialogKey).toContain('delete-match');
    expect(dialogConfig.title).toBe("マッチ削除の確認");
    expect(dialogConfig.confirmText).toBe("削除");
    expect(dialogConfig.cancelText).toBe("キャンセル");
    expect(dialogConfig.showCancel).toBe(true);
    expect(dialogConfig.onConfirm).toBeDefined();
  });

  it('未選択のマッチの削除を実行すると、該当マッチが削除されること', async () => {
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    // onConfirmコールバック関数
    let onConfirmCallback: (() => void) | undefined;
    
    // useDialogStoreのモック
    mockUseDialogStore({
      openDialog: (_key, config) => {
        if (config.onConfirm) {
          onConfirmCallback = config.onConfirm;
        }
      }
    });

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1',
      currentMatchId: null, // 未選択状態
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: mockMatches,
      getMatchesByCustomId: vi.fn().mockImplementation((customId) => 
        mockMatches.filter(match => match.customId === customId)
      ),
      deleteMatch: deleteMatchMock
    });
    
    // コンポーネントをレンダリング
    customRender(<Sidebar />);
    
    // onConfirmコールバックを直接実行（match1を削除）
    act(() => {
      if (onConfirmCallback) {
        onConfirmCallback();
      }
    });
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match1');
    
    // 選択中のマッチではないため、setCurrentMatchは呼ばれないことを確認
    expect(setCurrentMatchMock).not.toHaveBeenCalled();
  });

  it('選択中のマッチの削除を実行すると、該当マッチが削除され、直前のマッチが選択されること', async () => {
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    // onConfirmコールバック関数
    let onConfirmCallback: (() => void) | undefined;
    
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
        // match2削除後はmatch1のみを返す
        return [testMatches[0]];
      }
      return [];
    });
    
    // useDialogStoreのモック
    mockUseDialogStore({
      openDialog: (_key, config) => {
        if (config.onConfirm) {
          onConfirmCallback = config.onConfirm;
        }
      }
    });

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom1',
      currentMatchId: 'match2', // match2が選択状態
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: testMatches,
      getMatchesByCustomId: getMatchesByCustomIdMock,
      deleteMatch: deleteMatchMock
    });
    
    // コンポーネントをレンダリング
    customRender(<Sidebar />);
    
    // onConfirmコールバックを直接実行（match2を削除）
    act(() => {
      if (onConfirmCallback) {
        onConfirmCallback();
      }
    });
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match2');
    
    // 残りのマッチ（match1）が選択状態になることを確認
    expect(setCurrentMatchMock).toHaveBeenCalledWith('match1');
  });

  it('選択中の最後の1つのマッチの削除を実行すると、該当マッチが削除され、マッチが未選択状態になること', async () => {
    // deleteMatchのモック
    const deleteMatchMock = vi.fn();
    const setCurrentMatchMock = vi.fn();
    
    // onConfirmコールバック関数
    let onConfirmCallback: (() => void) | undefined;
    
    // マッチデータを明示的に設定（1つだけ）
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
        // match3削除後は空配列を返す
        return [];
      }
      return [];
    });
    
    // useDialogStoreのモック
    mockUseDialogStore({
      openDialog: (_key, config) => {
        if (config.onConfirm) {
          onConfirmCallback = config.onConfirm;
        }
      }
    });

    mockUseCustomStore({
      customs: mockCustoms,
      currentCustomId: 'custom2',
      currentMatchId: 'match3', // match3が選択状態
      setCurrentMatch: setCurrentMatchMock
    });
    
    mockUseMatchStore({
      matches: testMatches,
      getMatchesByCustomId: getMatchesByCustomIdMock,
      deleteMatch: deleteMatchMock
    });
    
    // コンポーネントをレンダリング
    customRender(<Sidebar />);
    
    // onConfirmコールバックを直接実行（match3を削除）
    act(() => {
      if (onConfirmCallback) {
        onConfirmCallback();
      }
    });
    
    // deleteMatchが呼ばれたことを確認
    expect(deleteMatchMock).toHaveBeenCalledWith('match3');
    
    // マッチがないため、currentMatchIdがnullになることを確認
    expect(setCurrentMatchMock).toHaveBeenCalledWith(null);
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
    const { getByText, findByLabelText } = customRender(<Sidebar />);
    
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
