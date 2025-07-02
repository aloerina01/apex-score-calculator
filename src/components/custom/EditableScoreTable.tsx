import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { MdEdit, MdError } from 'react-icons/md';
import { useTeamEditor } from '../../hooks/useTeamEditor';
import { useMatchStore } from '../../store/matchStore';
import type { ScoreRules } from '../../types/score';

interface EditableScoreTableProps {
  matchId: string;
  rule: ScoreRules;
}

/**
 * 編集可能なスコアテーブルを表示するコンポーネント
 */
export const EditableScoreTable = ({
  matchId,
  rule
}: EditableScoreTableProps) => {
  // ストアから直接データを取得
  const updateMatch = useMatchStore((state) => state.updateMatch);
  const currentMatch = useMatchStore(
    (state) => state.matches.find(m => m.id === matchId)
  );
  
  // マッチデータからチームを抽出
  const teams = currentMatch?.teams || [];
  
  // チーム編集フック
  const {
    editingTeam,
    editingField,
    editValue,
    hoveredTeam,
    inputRef,
    setHoveredTeam,
    handleStartEdit,
    handleFinishEdit,
    handleKeyDown,
    setEditValue
  } = useTeamEditor(teams, rule, (updatedTeams) => {
    updateMatch(matchId, {
      teams: updatedTeams
    });
  });
  
  if (teams.length === 0) {
    return null;
  }
  
  // 編集可能なテーブルを表示
  return (
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
          {teams.sort((a, b) => a.placement - b.placement).map((team, index) => {
            if (!team || !team.teamId) return null;
            return (
              <tr
                key={team.teamId}
                onMouseEnter={() => setHoveredTeam(team.teamId)}
                onMouseLeave={() => setHoveredTeam(null)}
                style={{
                  backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }}
              >
                <Table.Cell textAlign="center" width="60px">
                  {team.kills < 0 && <MdError color="red" style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                  {team.placement}
                </Table.Cell>
                <Table.Cell overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  <Flex alignItems="center">
                    {editingTeam === team.teamId && editingField === 'teamName' ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleFinishEdit}
                        onKeyDown={handleKeyDown}
                        size="sm"
                        width="100%"
                        autoFocus
                        m={0}
                        p={0}
                        border="none"
                        outline="none"
                        bg="yellow.100"
                        lineHeight="0.2rem"
                      />
                    ) : (
                      <>
                        <Text mr={1}>{team.teamName}</Text>
                        {hoveredTeam === team.teamId && (
                          <IconButton
                            aria-label="Edit team name"
                            size="xs"
                            variant="plain"
                            mt={-2}
                            mb={-2}
                            onClick={() => handleStartEdit(team.teamId, 'teamName')}
                          >
                            <MdEdit />
                          </IconButton>
                        )}
                      </>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell position="relative" width="60px">
                  <Flex alignItems="center" justifyContent="center">
                    {editingTeam === team.teamId && editingField === 'kills' ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleFinishEdit}
                        onKeyDown={handleKeyDown}
                        size="sm"
                        width="60px"
                        type="number"
                        autoFocus
                      />
                    ) : (
                      <>
                        <Text 
                          bg={team.kills < 0 ? 'red.100' : undefined}
                          px={team.kills < 0 ? 2 : 0}
                          borderRadius={team.kills < 0 ? 'md' : undefined}
                        >
                          {team.kills}
                        </Text>
                        {hoveredTeam === team.teamId && (
                          <IconButton
                            aria-label="Edit kills"
                            size="xs"
                            variant="plain"
                            ml={1}
                            mt={-2}
                            mb={-2}
                            position="absolute"
                            pl={10}
                            onClick={() => handleStartEdit(team.teamId, 'kills')}
                          >
                            <MdEdit />
                          </IconButton>
                        )}
                      </>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="center" width="60px">{team.killPoints}</Table.Cell>
                <Table.Cell textAlign="center" width="60px">{team.placementPoints}</Table.Cell>
                <Table.Cell textAlign="center" width="60px" fontWeight="bold">{team.totalPoints}</Table.Cell>
              </tr>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
