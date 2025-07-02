import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import { useScoreRulesStore } from '../../store/scoreRulesStore';
import { ScoreRules } from '../score/ScoreRules';
import { ImageUploader } from './ImageUploader';
import { AnimatableScoreResult } from './AnimatableScoreResult';

/**
 * マッチ詳細を表示するコンポーネント
 * 
 * このコンポーネントは、マッチの詳細情報を表示し、
 * 画像のアップロード、スコア計算、チームデータの編集などの機能を提供します。
 */
export const MatchDetail = () => {
  // ストアからのデータ取得
  const currentMatchId = useCustomStore((state) => state.currentMatchId);
  const updateMatch = useMatchStore((state) => state.updateMatch);
  const getCurrentCustom = useCustomStore((state) => state.getCurrentCustom);
  
  // currentMatchを直接ストアから取得（idと画像URLの変更のみを監視）
  const currentMatch = useMatchStore((state) => 
    currentMatchId ? state.matches.find(m => m.id === currentMatchId) : undefined
  );
  // スコアルールの取得
  const getRuleByMatchId = useScoreRulesStore((state) => state.getRuleByMatchId);
  const currentRule = getRuleByMatchId(currentMatch?.id || '');

  if (!currentMatch || !currentRule) {
    return null;
  }

  const currentCustom = getCurrentCustom();
  
  
  
  // 画像アップロード処理
  const handleImageUploaded = (imageUrl: string) => {
    if (currentMatch) {
      updateMatch(currentMatch.id, {
        imageUrl
      });
    }
  };
  
  // 必要なデータをメモ化
  const matchData = useMemo(() => ({
    id: currentMatch?.id || '',
    customId: currentCustom?.id || '',
    imageUrl: currentMatch?.imageUrl || '',
    teams: currentMatch?.teams || [],
    rule: currentRule,
  }), [currentMatch?.id, currentMatch?.imageUrl, currentMatch?.teams]); // currentCustom.idとdefaultRulesは依存から除外
  
  if (!currentMatch || !currentCustom) {
    return null;
  }

  return (
    <Box height="100%">
      <Box mb={6}>
        <ScoreRules customId={currentMatch.customId} matchId={currentMatch.id} />
      </Box>
      
      {!currentMatch.imageUrl ? (
        <ImageUploader onImageUploaded={handleImageUploaded} />
      ) : (
        <AnimatableScoreResult
          matchId={matchData.id}
          customId={matchData.customId}
          imageUrl={matchData.imageUrl}
          rule={matchData.rule}
        />
      )}
    </Box>
  );
};
