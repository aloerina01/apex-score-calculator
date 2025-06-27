import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import { useScoreRulesStore } from '../../store/scoreRulesStore';
import { ScoreRules } from '../score/ScoreRules';
import type { TeamScore } from '../../types/score';
import { ImageUploader } from './ImageUploader';
import { ResultDisplay } from './ResultDisplay';
import { useTeamEditor } from '../../hooks/useTeamEditor';
import { useScoreCalculation } from '../../hooks/useScoreCalculation';
import { useAnimatedDisplay } from '../../hooks/useAnimatedDisplay';

/**
 * マッチ詳細を表示するコンポーネント
 * 
 * このコンポーネントは、マッチの詳細情報を表示し、
 * 画像のアップロード、スコア計算、チームデータの編集などの機能を提供します。
 */
export const MatchDetail = () => {
  // 状態管理
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  // ストアからのデータ取得
  const currentMatchId = useCustomStore((state) => state.currentMatchId);
  const updateMatch = useMatchStore((state) => state.updateMatch);
  const getCurrentCustom = useCustomStore((state) => state.getCurrentCustom);
  
  // currentMatchを直接ストアから取得し、matches配列の変更を監視する
  const currentMatch = useMatchStore((state) => 
    currentMatchId ? state.matches.find(m => m.id === currentMatchId) : undefined
  );
  const currentCustom = getCurrentCustom();
  
  // コールバック関数をメモ化
  const updateTeamsCallback = useCallback((teams: TeamScore[]) => {
    if (currentMatch) {
      updateMatch({
        ...currentMatch,
        teams
      });
    }
  }, [currentMatch?.id, updateMatch]); // currentMatchオブジェクト全体ではなく、idだけを依存配列に入れる
  
  // スコアルールの取得
  const getRuleByMatchId = useScoreRulesStore((state) => state.getRuleByMatchId);
  const getDefaultRules = useScoreRulesStore((state) => state.getDefaultRules);
  
  // 現在のルールを取得
  const currentRule = currentMatch ? getRuleByMatchId(currentMatch.id) : undefined;
  const defaultRules = getDefaultRules();
  
  // カスタムフックの使用
  const teamEditor = useTeamEditor(
    currentMatch?.teams || [],
    currentRule || defaultRules,
    updateTeamsCallback
  );
  
  const { isCalculating, error, handleStartCalculation } = useScoreCalculation(
    currentCustom?.id || '',
    currentRule || defaultRules,
    updateTeamsCallback
  );
  
  // teamsをメモ化して不要な再計算を防ぐ
  const memoizedTeams = useMemo(() => currentMatch?.teams || [], [currentMatch?.id, currentMatch?.teams]);
  
  const { visibleItems, isComplete, resetDisplay } = useAnimatedDisplay(
    memoizedTeams,
    calculationComplete, // 集計完了時にAnimationをEnableにする
    150
  );
  
  // 画像アップロード処理
  const handleImageUploaded = (imageUrl: string) => {
    if (currentMatch) {
      updateMatch({
        ...currentMatch,
        imageUrl
      });
    }
  };
  
  
  // 集計開始
  const handleCalculateClick = async () => {
    if (!currentMatch || !currentMatch.imageUrl) return;
    
    setCalculationComplete(false);
    resetDisplay();
    
    await handleStartCalculation(currentMatch.imageUrl);
    setCalculationComplete(true);
  };
  
  // 初期レンダリング時に集計結果がある場合はcalculationCompleteをtrueに設定
  useEffect(() => {
    if (currentMatch && currentMatch.teams && currentMatch.teams.length > 0) {
      setCalculationComplete(false);
    }
  }, [currentMatch?.id]);
  
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
        <ResultDisplay
          imageUrl={currentMatch.imageUrl}
          teams={currentMatch.teams}
          visibleTeams={visibleItems}
          enableGradualDisplay={calculationComplete && visibleItems.length > 0}
          calculationComplete={isComplete}
          isCalculating={isCalculating}
          error={error}
          onCalculateClick={handleCalculateClick}
          teamEditorProps={teamEditor}
        />
      )}
    </Box>
  );
};
