import { useState } from 'react';
import type { ScoreRules, TeamScore } from '../types/score';
import type { GeminiApiResponse } from '../types/api';
import { analyzeImage } from '../services/geminiService';

/**
 * Gemini APIを使用した画像解析とスコア計算を担当するカスタムフック
 * 
 * @param customId カスタムID
 * @param rules スコア計算ルール
 * @param onCalculationComplete 計算が完了した時に呼び出されるコールバック関数
 * @returns 計算に関する状態と関数
 */
export function useScoreCalculation(
  customId: string,
  rules: Pick<ScoreRules, "killPointCap" | "placementPoints">,
  onCalculationComplete: (teams: TeamScore[]) => void
) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // スコア計算ロジック
  const calculateScores = (apiResponse: GeminiApiResponse[]): TeamScore[] => {
    return apiResponse.map(team => {
      const teamId = `${customId}_${team.team_name}`;
      
      // 順位ポイント計算
      const placementIndex = team.rank - 1;
      const placementPoints = placementIndex < rules.placementPoints.length 
        ? rules.placementPoints[placementIndex] 
        : 0;
      
      // キルポイント計算（キルポイント上限を考慮）
      const killPoints = rules.killPointCap > 0 
        ? Math.min(team.kill, rules.killPointCap) 
        : team.kill;
      
      // 合計ポイント
      const totalPoints = placementPoints + killPoints;
      
      return {
        teamId,
        teamName: team.team_name,
        placement: team.rank,
        kills: team.kill,
        placementPoints,
        killPoints,
        totalPoints
      };
    });
  };
  
  // 集計開始
  const handleStartCalculation = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Gemini APIを呼び出して画像を解析
      const apiResponse = await analyzeImage(imageUrl);
      
      // 解析結果からスコアを計算
      const calculatedTeams = calculateScores(apiResponse);
      
      // 計算結果を親コンポーネントに通知
      onCalculationComplete(calculatedTeams);
      
      return calculatedTeams;
    } catch (error) {
      console.error('画像解析エラー:', error);
      setError(error instanceof Error ? error.message : '画像の解析中にエラーが発生しました');
      return [];
    } finally {
      setIsCalculating(false);
    }
  };
  
  return {
    isCalculating,
    error,
    handleStartCalculation
  };
}
