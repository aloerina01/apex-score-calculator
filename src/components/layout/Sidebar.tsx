import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Button,
  Text,
  Flex,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdAdd, MdDelete } from 'react-icons/md';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import type { Custom } from '../../types/custom';
import type { Match } from '../../types/match';

export const Sidebar = () => {
  const [expandedCustoms, setExpandedCustoms] = useState<Record<string, boolean>>({});
  const [hoveredCustomId, setHoveredCustomId] = useState<string | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  
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
  const getDefaultRules = useMatchStore((state) => state.getDefaultRules);
  
  const handleCreateCustom = () => {
    const newCustomName = prompt('カスタム名を入力してください');
    if (!newCustomName?.trim()) return;
    
    const newCustom: Custom = {
      id: `custom_${Date.now()}`,
      name: newCustomName,
      createdAt: Date.now(),
      matches: [],
    };
    
    addCustom(newCustom);
    
    // 新しいカスタムを選択状態にする
    setCurrentCustom(newCustom.id);
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
    
    if (window.confirm('このカスタムとカスタムのすべてのマッチを削除しますか？この操作は元に戻せません')) {
      const matchesToDelete = getMatchesByCustomId(customId);
      
      matchesToDelete.forEach(match => {
        deleteMatch(match.id);
      });
      
      deleteCustom(customId);
    }
  };
  
  const handleDeleteMatch = (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を止める
    
    if (window.confirm('このマッチを削除しますか？この操作は元に戻せません')) {
      deleteMatch(matchId);
    }
  };
  
  const handleSelectMatch = (matchId: string, customId: string) => {
    setCurrentCustom(customId);
    setCurrentMatch(matchId);
  };
  
  const handleAddMatch = (customId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を止める
    
    const matches = getMatchesByCustomId(customId);
    const matchNumber = matches.length + 1;
    const defaultRules = getDefaultRules();
    
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      customId: customId,
      matchNumber,
      teams: [],
      rules: defaultRules,
      createdAt: Date.now(),
    };
    
    addMatch(newMatch);
    
    setCurrentCustom(customId);
    setCurrentMatch(newMatch.id);
    
    setExpandedCustoms((prev) => ({
      ...prev,
      [customId]: true,
    }));
  };
  
  return (
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
                            onClick={(e) => handleDeleteMatch(match.id, e)}
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
  );
};
