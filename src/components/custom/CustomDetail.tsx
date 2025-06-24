import { Box, Button, Text, Flex, Icon } from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { MdContentCopy } from 'react-icons/md';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import type { Match } from '../../types/match';

export const CustomDetail = () => {
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableOnlyRef = useRef<HTMLDivElement>(null);
  
  const currentCustomId = useCustomStore((state) => state.currentCustomId);
  const getCurrentCustom = useCustomStore((state) => state.getCurrentCustom);
  const getMatchesByCustomId = useMatchStore((state) => state.getMatchesByCustomId);
  const getDefaultRules = useMatchStore((state) => state.getDefaultRules);
  const addMatch = useMatchStore((state) => state.addMatch);
  const setCurrentMatch = useCustomStore((state) => state.setCurrentMatch);

  const currentCustom = getCurrentCustom();
  const matches = currentCustomId ? getMatchesByCustomId(currentCustomId) : [];
  
  // 集計完了したマッチ数
  const completedMatches = matches.filter(match => match.teams && match.teams.length > 0);
  
  // 参加チーム数の最大値
  const maxTeamCount = completedMatches.reduce((max, match) => {
    const teamCount = match.teams ? match.teams.length : 0;
    return Math.max(max, teamCount);
  }, 0);
  
  // すべてのマッチの累積結果
  const calculateCumulativeResults = () => {

    const teamResults: Record<string, {
      teamName: string,
      totalKills: number,
      totalKillPoints: number,
      totalPlacementPoints: number,
      totalPoints: number,
      bestPlacement: number,
      matchesPlayed: number
    }> = {};
    
    // すべてのマッチのチームデータを集計
    completedMatches.forEach(match => {
      if (!match.teams) return;
      
      match.teams.forEach(team => {
        if (!teamResults[team.teamName]) {
          teamResults[team.teamName] = {
            teamName: team.teamName,
            totalKills: 0,
            totalKillPoints: 0,
            totalPlacementPoints: 0,
            totalPoints: 0,
            bestPlacement: team.placement,
            matchesPlayed: 0
          };
        }
        
        const result = teamResults[team.teamName];
        result.totalKills += team.kills;
        result.totalKillPoints += team.killPoints;
        result.totalPlacementPoints += team.placementPoints;
        result.totalPoints += team.totalPoints;
        result.bestPlacement = Math.min(result.bestPlacement, team.placement);
        result.matchesPlayed += 1;
      });
    });
    
    return Object.values(teamResults).sort((a, b) => b.totalPoints - a.totalPoints);
  };
  
  const cumulativeResults = calculateCumulativeResults();
  
  // チーム名をキーにして集計しているので、チーム数が多い場合はエラーを表示
  const hasTeamNameError = cumulativeResults.length > maxTeamCount;

  const handleStartNewMatch = () => {
    if (!currentCustomId || !currentCustom) return;

    const matchNumber = matches.length + 1;
    const defaultRules = getDefaultRules();

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      customId: currentCustomId,
      matchNumber,
      teams: [],
      rules: defaultRules,
      createdAt: Date.now(),
    };

    addMatch(newMatch);
    setCurrentMatch(newMatch.id);
  };

  const handleCopyResults = async () => {
    if (!tableOnlyRef.current) return;
    
    try {
      const canvas = await html2canvas(tableOnlyRef.current);
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
      });
    } catch (error) {
      console.error('結果のコピーに失敗しました:', error);
    }
  };

  if (!currentCustom) {
    return null;
  }

  return (
    <Flex color="gray.950" height="100%" gap={4}>
      <Box flex="1">
        {matches.length === 0 ? (
          <Box mb={6}>
            <Button variant="solid" colorPalette="blue" size="lg" onClick={handleStartNewMatch}>
              マッチの集計を始める
            </Button>
          </Box>
        ) : (
          <Box mb={6}>
            <Button variant="solid" colorPalette="blue" size="lg" onClick={handleStartNewMatch} mb={4}>
              次のマッチの集計を始める
            </Button>            
            {completedMatches.length > 0 && (
              <Box mt={6} mr="auto" ml="auto" minWidth="780px" border="1px solid" borderColor="gray.200" borderRadius="md" p={4} ref={containerRef}>
                <Flex justifyContent="space-between" alignItems="center" mb={3}>
                  <Flex alignItems="center" flexWrap="wrap">
                    <Text fontSize="lg" fontWeight="bold" mr={3}>{currentCustom.name} - 総合結果</Text>
                    <Text fontSize="sm" color="gray.600" mr={3}>{completedMatches.length}/{matches.length}マッチ集計済み</Text>
                    {hasTeamNameError && (
                      <Text fontSize="sm" color="red.500" fontWeight="bold">
                        全部で{cumulativeResults.length}チーム分の集計結果があります。各マッチでチーム名が適切か確認してください
                      </Text>
                    )}
                  </Flex>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyResults}
                    position="relative"
                  >
                    <Icon as={MdContentCopy} mr={1} />
                    {isCopied ? "コピーしました！" : "結果をコピー"}
                  </Button>
                </Flex>
                
                {/* コピー用の非表示テーブル（ヘッダーのみ） */}
                <Box 
                  position="absolute" 
                  left="-9999px" 
                  ref={tableOnlyRef}
                  p={8}
                >
                  <Text fontSize="lg" fontWeight="bold" mb={3}>{currentCustom.name} - 総合結果</Text>
                  <Table.Root key="copy-table" size="sm" width="880px" striped>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>順位</Table.ColumnHeader>
                        <Table.ColumnHeader>チーム名</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">キル数</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">キルPt</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">順位Pt</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">合計Pt</Table.ColumnHeader>
                      </Table.Row>                    
                    </Table.Header>
                    <Table.Body color="black">
                      {cumulativeResults.map((team, index) => (
                        <Table.Row key={`copy-${team.teamName}`}>
                          <Table.Cell>{index + 1}</Table.Cell>
                          <Table.Cell>{team.teamName}</Table.Cell>
                          <Table.Cell textAlign="center">{team.totalKills}</Table.Cell>
                          <Table.Cell textAlign="center">{team.totalKillPoints}</Table.Cell>
                          <Table.Cell textAlign="center">{team.totalPlacementPoints}</Table.Cell>
                          <Table.Cell textAlign="center" fontWeight="bold">{team.totalPoints}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
                
                {/* 表示用テーブル */}
                <Table.Root key="sm" size="sm" striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>順位</Table.ColumnHeader>
                      <Table.ColumnHeader>チーム名</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">キル数</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">キルPt</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">順位Pt</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">合計Pt</Table.ColumnHeader>
                    </Table.Row>                    
                  </Table.Header>
                  <Table.Body color="black">
                    {cumulativeResults.map((team, index) => (
                      <Table.Row key={team.teamName}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>{team.teamName}</Table.Cell>
                        <Table.Cell textAlign="center">{team.totalKills}</Table.Cell>
                        <Table.Cell textAlign="center">{team.totalKillPoints}</Table.Cell>
                        <Table.Cell textAlign="center">{team.totalPlacementPoints}</Table.Cell>
                        <Table.Cell textAlign="center" fontWeight="bold">{team.totalPoints}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
};
