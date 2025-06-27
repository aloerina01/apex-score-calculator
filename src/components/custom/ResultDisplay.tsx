import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { MatchDetailTable } from './MatchDetailTable';
import type { TeamScore } from '../../types/score';

interface ResultDisplayProps {
  imageUrl: string;
  teams: TeamScore[];
  visibleTeams: TeamScore[];
  enableGradualDisplay: boolean;
  calculationComplete: boolean;
  isCalculating: boolean;
  error: string | null;
  onCalculateClick: () => void;
  teamEditorProps: {
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
  };
}

/**
 * 画像と結果テーブルを表示するコンポーネント
 */
export const ResultDisplay = ({
  imageUrl,
  teams,
  visibleTeams,
  enableGradualDisplay,
  calculationComplete,
  isCalculating,
  error,
  onCalculateClick,
  teamEditorProps
}: ResultDisplayProps) => {
  return (
    <Box mb={4}>
      {/* 画像アップロード後のレイアウト - 左側に画像、右側に集計結果 */}
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
            onClick={onCalculateClick} 
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
        {teams.length > 0 && (
          <MatchDetailTable
            teams={teams}
            visibleTeams={visibleTeams}
            enableGradualDisplay={enableGradualDisplay}
            calculationComplete={calculationComplete}
            {...teamEditorProps}
          />
        )}
      </Flex>
    </Box>
  );
};
