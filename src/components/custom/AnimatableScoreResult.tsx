import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useScoreCalculation } from '../../hooks/useScoreCalculation';
import { useAnimatedDisplay } from '../../hooks/useAnimatedDisplay';
import { EditableScoreTable } from './EditableScoreTable';
import { useMatchStore } from '../../store/matchStore';
import type { TeamScore } from '../../types/score';
import type { ScoreRules } from '../../types/score';

interface AnimatableScoreResultProps {
  matchId: string;
  customId: string;
  imageUrl: string;
  rule: ScoreRules;
}

/**
 * 集計結果をアニメーション表示するコンポーネント
 */
export const AnimatableScoreResult = ({
  matchId,
  customId,
  imageUrl,
  rule
}: AnimatableScoreResultProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const updateMatch = useMatchStore((state) => state.updateMatch);
  
  // Storeから直接最新のマッチデータを取得
  const currentMatch = useMatchStore(
    (state) => state.matches.find(m => m.id === matchId)
  );
  
  // マッチデータからチームを抽出
  const teams = useMemo(() => currentMatch?.teams || [], [currentMatch]);
  
  // スコア計算フック
  const { isCalculating, error, handleStartCalculation } = useScoreCalculation(
    customId,
    rule,
    (calculatedTeams: TeamScore[]) => {
      updateMatch(matchId, {
        teams: calculatedTeams
      });
    }
  );
  
  // アニメーション表示フック
  const { visibleItems, isComplete, resetDisplay } = useAnimatedDisplay(
    teams,
    isAnimating,
    150
  );
  
  // アニメーション完了時の処理
  useEffect(() => {
    if (isComplete) {
      setIsAnimating(false);
    }
  }, [isComplete]);
  
  // 集計開始
  const handleCalculateClick = async () => {
    resetDisplay();
    setIsAnimating(true);  // 集計時のみアニメーションつきで描画する
    await handleStartCalculation(imageUrl);
  };

  // Sidebar等からマッチを手動で切り替えた直後はアニメーションなしで結果を表示する
  useEffect(() => {
    setIsAnimating(false);
  }, [currentMatch?.id]);

  return (
    <Box flex="1">
      <Flex gap={6} alignItems="flex-start">
        {/* 左側 - アップロード画像 */}
        <Box flex="1">
          <Text color="gray.950" fontSize="lg" fontWeight="bold" mb={3}>リザルト</Text>
          <Image 
            src={imageUrl} 
            alt="リザルト画像" 
            maxH="500px" 
            mb={4} 
            mt={10}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          />
          <Button 
            colorPalette="blue" 
            onClick={handleCalculateClick} 
            loading={isCalculating}
            loadingText="解析中..."
            disabled={isCalculating || !imageUrl}
            mb={2}
          >
            {teams.length > 0 ? '再集計' : '集計開始'}
          </Button>
          {error && (
            <Text color="red.500" fontSize="sm" mt={2}>
              エラー: {error}
            </Text>
          )}
        </Box>
        
        {/* 右側 - 集計結果テーブル */}
        <Box flex="1">
          {isCalculating ? (
            /* 集計中はローディングインジケータを表示 */
            <Box>
              <Text color="gray.950" fontSize="lg" fontWeight="bold" mb={3}>集計結果</Text>
              <Flex justifyContent="center" alignItems="center" height="200px">
                <Text>集計中...</Text>
              </Flex>
            </Box>
          ) : isAnimating ? (
            /* アニメーションテーブル */
            <Box>
              <Text color="gray.950" fontSize="lg" fontWeight="bold" mb={3}>集計結果</Text>
              <Table.Root key="md" size="md" striped tableLayout="fixed" width="100%">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader textAlign="center" width="60px">順位</Table.ColumnHeader>
                    <Table.ColumnHeader width="auto">チーム名</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" width="92px">キル数</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" width="84px">キルPt</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" width="84px">順位Pt</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center" width="84px">合計Pt</Table.ColumnHeader>
                  </Table.Row>                    
                </Table.Header>
                <Table.Body color="black">
                  {visibleItems.map((team, index) => (
                    <motion.tr
                      key={team.teamId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      style={{
                        display: 'table-row',
                        backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                      }}
                    >
                      <Table.Cell textAlign="center" width="60px">{team.placement}</Table.Cell>
                      <Table.Cell overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{team.teamName}</Table.Cell>
                      <Table.Cell textAlign="center" width="60px">{team.kills}</Table.Cell>
                      <Table.Cell textAlign="center" width="60px">{team.killPoints}</Table.Cell>
                      <Table.Cell textAlign="center" width="60px">{team.placementPoints}</Table.Cell>
                      <Table.Cell textAlign="center" width="60px" fontWeight="bold">{team.totalPoints}</Table.Cell>
                    </motion.tr>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            /* 編集可能なテーブル */
            <EditableScoreTable
              matchId={matchId}
              rule={rule}
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
};
