import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Button,
  Text,
  Flex,
  Icon,
  IconButton,
  Input,
} from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdAdd, MdDelete } from 'react-icons/md';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import { useScoreRulesStore } from '../../store/scoreRulesStore';
import { useDialog } from '../../hooks/useDialog';
import type { Custom } from '../../types/custom';
import type { Match } from '../../types/match';
import { AnnouncementDialog } from '../ui/AnnouncementDialog';

export const Sidebar = () => {
  const [expandedCustoms, setExpandedCustoms] = useState<Record<string, boolean>>({});
  const [hoveredCustomId, setHoveredCustomId] = useState<string | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [newCustomName, setNewCustomName] = useState('');
  
  const customs = useCustomStore((state) => state.customs);
  const currentCustomId = useCustomStore((state) => state.currentCustomId);
  const currentMatchId = useCustomStore((state) => state.currentMatchId);
  const addCustom = useCustomStore((state) => state.addCustom);
  const deleteCustom = useCustomStore((state) => state.deleteCustom);
  const setCurrentCustom = useCustomStore((state) => state.setCurrentCustom);
  const setCurrentMatch = useCustomStore((state) => state.setCurrentMatch);
  const getMatchesByCustomId = useMatchStore((state) => state.getMatchesByCustomId);
  const addMatch = useMatchStore((state) => state.addMatch);
  const deleteMatch = useMatchStore((state) => state.deleteMatch);
  const addRule = useScoreRulesStore((state) => state.addRule);
  const getDefaultRules = useScoreRulesStore((state) => state.getDefaultRules);
  
  // ダイアログフックを使用
  const { openDialog, setDialogConfig, generateDialogKey } = useDialog();
  
  // ダイアログキーを生成
  const createCustomDialogKey = useMemo(() => generateDialogKey('create-custom'), [generateDialogKey]);
  const deleteCustomDialogKey = useMemo(() => generateDialogKey('delete-custom'), [generateDialogKey]);
  const deleteMatchDialogKey = useMemo(() => generateDialogKey('delete-match'), [generateDialogKey]);
  
  const handleCreateCustom = () => {
    // 入力値をリセット
    setNewCustomName('');
    
    // カスタム作成ダイアログを表示
    openDialog(createCustomDialogKey, {
      title: "カスタム作成",
      confirmText: "作成",
      showCancel: true,
      cancelText: "キャンセル",
      isValid: false, // 初期状態では無効（カスタム名が空のため）
      onConfirm: () => {
        const customName = newCustomName.trim();
        const newCustom: Custom = {
          id: `custom_${Date.now()}`,
          name: customName,
          createdAt: Date.now(),
          matches: [],
        };
        
        addCustom(newCustom);
        setCurrentCustom(newCustom.id);
      }
    });
  };
  
  // カスタム名の入力値が変更されたときの処理
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCustomName(value);
    
    // ダイアログ設定を更新（isValidを更新）
    setDialogConfig(createCustomDialogKey, {
      isValid: value.trim().length > 0
    });
  };
  
  // currentCustomIdまたはcurrentMatchIdが変更されたときに、対応するカスタムのExpandを展開する
  useEffect(() => {
    if (currentCustomId) {
      setExpandedCustoms((prev) => ({
        ...prev,
        [currentCustomId]: true,
      }));
    }
    
    if (currentMatchId) {
      const match = customs.flatMap(custom => 
        getMatchesByCustomId(custom.id)
      ).find(match => match.id === currentMatchId);
      
      if (match) {
        setExpandedCustoms((prev) => ({
          ...prev,
          [match.customId]: true,
        }));
      }
    }
  }, [currentCustomId, currentMatchId, customs, getMatchesByCustomId]);
  
  const toggleCustomExpand = (customId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // カスタム選択イベントが発火しないようにする
    setExpandedCustoms((prev) => ({
      ...prev,
      [customId]: !prev[customId],
    }));
  };
  
  const handleSelectCustom = (customId: string) => {
    setCurrentCustom(customId);
  };
  
  const handleDeleteCustom = (customId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を止める
    
    // 確認ダイアログを表示
    openDialog(deleteCustomDialogKey, {
      title: "カスタム削除の確認",
      confirmText: "削除",
      cancelText: "キャンセル",
      showCancel: true,
      onConfirm: () => {
        const matches = getMatchesByCustomId(customId);
        matches.forEach(match => {
          deleteMatch(match.id);
        });
        deleteCustom(customId);
        setCurrentCustom(null);
        setCurrentMatch(null);
      }
    });
  };
  
  const handleDeleteMatch = (customId: string, matchId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を止める
    
    // 確認ダイアログを表示
    openDialog(deleteMatchDialogKey, {
      title: "マッチ削除の確認",
      confirmText: "削除",
      cancelText: "キャンセル",
      showCancel: true,
      onConfirm: () => {
        deleteMatch(matchId);
        if(currentMatchId === matchId) {
          const matches = getMatchesByCustomId(customId);
          setCurrentMatch(matches.length > 0 ? matches[0].id : null);
        }
      }
    });
  };
  
  const handleSelectMatch = (matchId: string, customId: string) => {
    setCurrentCustom(customId);
    setCurrentMatch(matchId);
  };
  
  const handleAddMatch = (customId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を止める
    
    const matches = getMatchesByCustomId(customId);
    const matchNumber = matches.length + 1;
    const matchId = `${customId}_match_${Date.now()}`;
    
    // 新しいマッチを作成
    const newMatch: Match = {
      id: matchId,
      customId: customId,
      matchNumber,
      teams: [],
      createdAt: Date.now(),
    };
    
    // マッチを保存
    addMatch(newMatch);
    
    // 直前のマッチがあればそのルールを取得、なければデフォルトルールを使用
    const previousMatch = matches.length > 0 ? matches[matches.length - 1] : null;
    const defaultRules = getDefaultRules(previousMatch?.id);
    
    // ルールを保存
    addRule({
      id: `${customId}_${matchId}_rule_${Date.now()}`,
      customId: customId,
      matchId: matchId,
      ...defaultRules
    });
    
    setCurrentCustom(customId);
    setCurrentMatch(newMatch.id);
    
    setExpandedCustoms((prev) => ({
      ...prev,
      [customId]: true,
    }));
  };

  return (
    <>
      <Box
        width="300px"
        height="100%"
        bg="white"
        p={4}
        borderRightWidth={1}
        borderColor="gray.200"
        overflowY="auto"
      >
        <Button
          width="100%"
          mb={4}
          onClick={handleCreateCustom}
          variant="outline"
          font-weight="bold"
        >
          <Icon as={MdAdd} boxSize={4} />
          新しいカスタムを始める
        </Button>
        
        <Stack gap={2}>
          {customs.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              カスタムがありません
            </Text>
          ) : (
            customs.map((custom) => {
              const matches = getMatchesByCustomId(custom.id);
              const isSelected = currentCustomId === custom.id && !currentMatchId;
              
              return (
                <Box key={custom.id}>
                <Flex
                  p={2}
                  borderRadius="md"
                  bg={isSelected ? 'blue.100' : 'transparent'}
                  _hover={{ bg: isSelected ? 'blue.100' : 'gray.200' }}
                  cursor="pointer"
                  align="center"
                  onMouseEnter={() => setHoveredCustomId(custom.id)}
                  onMouseLeave={() => setHoveredCustomId(null)}
                >
                  <Icon
                    as={expandedCustoms[custom.id] ? MdKeyboardArrowDown : MdKeyboardArrowRight}
                    onClick={(e) => toggleCustomExpand(custom.id, e)}
                    mr={2}
                    boxSize={4}
                    cursor="pointer"
                     color="gray.950"
                  />
                  <Text
                    flex="1"
                    color="gray.950"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    lineClamp="1"
                    onClick={() => handleSelectCustom(custom.id)}
                  >
                    {custom.name}
                  </Text>
                  {hoveredCustomId === custom.id && (
                    <IconButton
                      aria-label="Delete custom"
                      size="xs"
                      variant="ghost"
                      mt="-1.5"
                      mb="-1.5"
                      onClick={(e) => handleDeleteCustom(custom.id, e)}
                    >
                      <MdDelete />
                    </IconButton>
                  )}
                </Flex>
                
                {expandedCustoms[custom.id] && (
                  <Stack gap={1} pl={8} mt={1}>
                    {matches.map((match) => (
                      <Flex
                        key={match.id}
                        p={2}
                        borderRadius="md"
                        bg={currentMatchId === match.id ? 'blue.100' : 'transparent'}
                        _hover={{ bg: currentMatchId === match.id ? 'blue.100' : 'gray.200' }}
                        cursor="pointer"
                        onClick={() => handleSelectMatch(match.id, custom.id)}
                        onMouseEnter={() => setHoveredMatchId(match.id)}
                        onMouseLeave={() => setHoveredMatchId(null)}
                        align="center"
                      >
                        <Text 
                          flex="1"
                          color="gray.950" 
                          fontSize="sm" 
                          fontWeight={currentMatchId === match.id ? 'bold' : 'normal'}
                        >
                          マッチ {match.matchNumber}
                        </Text>
                        {hoveredMatchId === match.id && (
                          <IconButton
                            aria-label="Delete match"
                            size="xs"
                            variant="ghost"
                            mt="-1.5"
                            mb="-1.5"
                            onClick={(e) => handleDeleteMatch(custom.id, match.id, e)}
                          >
                            <MdDelete />
                          </IconButton>
                        )}
                      </Flex>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleAddMatch(custom.id, e)}
                      mt={1}
                    >
                      <Icon as={MdAdd} boxSize={3} mr={1} color="gray.700" />
                      新規マッチを追加
                    </Button>
                  </Stack>
                )}
                </Box>
              );
            })
          )}
        </Stack>
      </Box>
      
      {/* カスタム作成ダイアログの内容 */}
      <AnnouncementDialog dialogKey={createCustomDialogKey}>
        <Box>
          <Text mb={4} color="gray.950">カスタム名を入力してください</Text>
          <Input 
            value={newCustomName} 
            onChange={handleCustomNameChange} 
            placeholder="カスタム名"
            autoFocus
            color="gray.950"
          />
        </Box>
      </AnnouncementDialog>
      
      {/* カスタム削除確認ダイアログの内容 */}
      <AnnouncementDialog dialogKey={deleteCustomDialogKey}>
        <Text color="gray.950">このカスタムとカスタムのすべてのマッチを削除しますか？<br/>この操作は元に戻せません</Text>
      </AnnouncementDialog>
      
      {/* マッチ削除確認ダイアログの内容 */}
      <AnnouncementDialog dialogKey={deleteMatchDialogKey}>
        <Text color="gray.950">このマッチを削除しますか？この操作は元に戻せません</Text>
      </AnnouncementDialog>
    </>
  );
};
