import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { MdEdit, MdError } from 'react-icons/md';
import { motion } from 'framer-motion';
import type { TeamScore } from '../../types/score';

interface MatchDetailTableProps {
  teams: TeamScore[];
  visibleTeams: TeamScore[];
  enableGradualDisplay: boolean; // アニメーションをつかった段階的表示をするかどうかのフラグ
  calculationComplete: boolean;
  editingTeam: string | null;
  editingField: 'teamName' | 'kills' | null;
  editValue: string;
  hoveredTeam: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setHoveredTeam: (teamId: string | null) => void;
  handleStartEdit: (teamId: string, field: 'teamName' | 'kills') => void;
  handleFinishEdit: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setEditValue: (value: string) => void;
}

/**
 * 結果テーブルを表示するコンポーネント
 */
export const MatchDetailTable = ({
  teams,
  visibleTeams,
  enableGradualDisplay,
  calculationComplete,
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
}: MatchDetailTableProps) => {
  // 表示するチームデータ
  const displayTeams = enableGradualDisplay ? visibleTeams : teams.sort((a, b) => a.placement - b.placement);
  
  return (
    <Box flex="1">
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
          {displayTeams.map((team, index) => {
            if (!team || !team.teamId) return null;
            return (
              <motion.tr
                key={team.teamId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3,
                  delay: enableGradualDisplay ? 0.05 * index : 0 // 段階的表示時のみディレイを適用
                }}
                onMouseEnter={() => setHoveredTeam(team.teamId)}
                onMouseLeave={() => setHoveredTeam(null)}
                style={{
                  display: 'table-row',
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
                      {hoveredTeam === team.teamId && calculationComplete && (
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
                      {hoveredTeam === team.teamId && calculationComplete && (
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
              </motion.tr>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
