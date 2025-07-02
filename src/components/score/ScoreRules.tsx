import { useState, useEffect } from 'react';
import { Box, Stack, Text, Input, Flex } from '@chakra-ui/react';
import { useScoreRulesStore } from '../../store/scoreRulesStore';

interface ScoreRulesProps {
  customId: string;
  matchId: string;
}

export const ScoreRules = ({ customId, matchId }: ScoreRulesProps) => {
  const getRuleByMatchId = useScoreRulesStore((state) => state.getRuleByMatchId);
  const updateRule = useScoreRulesStore((state) => state.updateRule);
  const addRule = useScoreRulesStore((state) => state.addRule);
  const getDefaultRule = useScoreRulesStore((state) => state.getDefaultRule);
  
  // 現在のルールを取得または新規作成
  const currentRule = getRuleByMatchId(matchId);
  
  const [killPointCap, setKillPointCap] = useState(currentRule?.killPointCap ?? getDefaultRule().killPointCap);
  const [placementPoints, setPlacementPoints] = useState<number[]>(
    currentRule?.placementPoints ?? getDefaultRule().placementPoints
  );
  const [isValid, setIsValid] = useState(true);
  
  // matchIdが変更されたときに状態を更新する
  useEffect(() => {
    const rule = getRuleByMatchId(matchId);
    setKillPointCap(rule?.killPointCap ?? getDefaultRule().killPointCap);
    setPlacementPoints(rule?.placementPoints ?? getDefaultRule().placementPoints);
  }, [matchId, getRuleByMatchId, getDefaultRule]);

  // ルールの検証
  const validateRules = () => {
    // キルポイント上限は数値であればOK
    if (isNaN(killPointCap)) {
      return false;
    }
    if (killPointCap < 0) {
      setKillPointCap(0);
    }
    
    // 順位ポイントはすべて数値であることを確認
    for (const point of placementPoints) {
      if (isNaN(point)) {
        return false;
      }
    }
    
    return true;
  };
  
  // ルールが変更されたときに検証と保存を行う
  useEffect(() => {
    const valid = validateRules();
    setIsValid(valid);
    
    if (valid) {
      const ruleData = {
        customId,
        matchId,
        killPointCap,
        placementPoints,
      };
      
      // ストアに保存
      if (currentRule) {
        updateRule(ruleData);
      } else {
        addRule(ruleData);
      }
    }
  }, [killPointCap, placementPoints, customId, matchId, currentRule, updateRule, addRule]);
  
  // 入力値の変更を処理
  const handleKillPointCapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setKillPointCap(isNaN(value) ? 0 : value);
  };

  const handlePlacementPointChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const newPoints = [...placementPoints];
    newPoints[index] = isNaN(value) ? 0 : value;
    setPlacementPoints(newPoints);
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" borderWidth={1} borderColor="gray.200" width="100%">
      <Text color="gray.950" fontSize="lg" fontWeight="bold" mb={4}>
        スコアルール設定
      </Text>

      <Stack gap={4}>
        {/* キルポイント上限 - 1行目 */}
        <Flex align="center" gap={4}>
          <Text color="gray.950" width="150px">キルポイント上限</Text>
          <Box width="200px">
            <Input
              type="number"
              value={killPointCap}
              onChange={handleKillPointCapChange}
              min={0}
              color="gray.950"
              placeholder="0"
            />
          </Box>
          <Text fontSize="sm" color="gray.500">
            上限がない場合は0
          </Text>
        </Flex>

        {/* 順位ポイント - 2行目 */}
        <Box>
          <Text color="gray.950" mb={2}>順位ポイント</Text>
          <Flex gap={4} flexWrap="wrap">
            {/* 1〜10位 */}
            <Flex gap={3} flexWrap="wrap">
              {placementPoints.slice(0, 10).map((points, index) => (
                <Flex key={index} align="center" width="120px">
                  <Text color="gray.950" width="40px">{index + 1}位</Text>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => handlePlacementPointChange(index, e)}
                    min={0}
                    width="60px"
                    color="gray.950"
                    size="sm"
                  />
                </Flex>
              ))}
            </Flex>
            
            {/* 11〜20位 */}
            <Flex gap={3} flexWrap="wrap">
              {placementPoints.slice(10, 20).map((points, index) => (
                <Flex key={index + 10} align="center" width="120px">
                  <Text color="gray.950" width="40px">{index + 11}位</Text>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => handlePlacementPointChange(index + 10, e)}
                    min={0}
                    width="60px"
                    color="gray.950"
                    size="sm"
                  />
                  <Text ml={1} fontSize="sm">pt</Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Box>

        {!isValid && (
          <Text color="red.500" fontSize="sm">
            すべての項目に有効な数値を入力してください
          </Text>
        )}
      </Stack>
    </Box>
  );
};
