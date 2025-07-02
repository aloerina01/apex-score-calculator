import { useState, useRef } from 'react';
import type { ScoreRules, TeamScore } from '../types/score';

/**
 * チームデータの編集機能を担当するカスタムフック
 * 
 * @param teams 編集対象のチームデータ配列
 * @param rules スコア計算ルール
 * @param onTeamsUpdated チームデータが更新された時に呼び出されるコールバック関数
 * @returns チーム編集に関する状態と関数
 */
export function useTeamEditor(
  teams: TeamScore[],
  rules: Pick<ScoreRules, "killPointCap" | "placementPoints">,
  onTeamsUpdated: (teams: TeamScore[]) => void
) {
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'teamName' | 'kills' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 編集開始
  const handleStartEdit = (teamId: string, field: 'teamName' | 'kills') => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team) return;
    
    setEditingTeam(teamId);
    setEditingField(field);
    setEditValue(field === 'teamName' ? team.teamName : team.kills.toString());
    
    // フォーカスを遅延させて設定（レンダリング後に実行）
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 10);
  };
  
  // 編集完了
  const handleFinishEdit = () => {
    if (editingTeam && editingField) {
      updateTeamAndRecalculate(editingTeam, editingField, editValue);
    }
    
    setEditingTeam(null);
    setEditingField(null);
    setEditValue('');
  };
  
  // キー入力処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditingTeam(null);
      setEditingField(null);
      setEditValue('');
    }
  };
  
  // チーム情報の更新と再計算
  const updateTeamAndRecalculate = (teamId: string, field: 'teamName' | 'kills', value: string) => {
    // 現在のチームデータをコピー
    const updatedTeams = [...teams];
    
    // 更新対象のチームを見つける
    const teamIndex = updatedTeams.findIndex(team => team.teamId === teamId);
    if (teamIndex === -1) return;
    
    // チームデータを更新
    const updatedTeam = { ...updatedTeams[teamIndex] };
    
    if (field === 'teamName') {
      updatedTeam.teamName = value;
    } else if (field === 'kills') {
      const kills = parseInt(value);
      if (isNaN(kills)) return;
      
      updatedTeam.kills = kills;
      
      // キルポイントを再計算
      updatedTeam.killPoints = rules.killPointCap > 0 
        ? Math.min(kills, rules.killPointCap) 
        : kills;
      
      // 合計ポイントを再計算
      updatedTeam.totalPoints = updatedTeam.placementPoints + updatedTeam.killPoints;
    }
    
    // 更新したチームデータを配列に戻す
    updatedTeams[teamIndex] = updatedTeam;
    
    // 合計ポイントでソートして順位を再計算
    const sortedTeams = [...updatedTeams].sort((a, b) => b.totalPoints - a.totalPoints);
    
    sortedTeams.forEach((team, index) => {
      const teamIdx = updatedTeams.findIndex(t => t.teamId === team.teamId);
      if (teamIdx !== -1) {
        updatedTeams[teamIdx] = {
          ...updatedTeams[teamIdx],
          placement: index + 1
        };
      }
    });
    
    // 更新されたチームデータを親コンポーネントに通知
    onTeamsUpdated(updatedTeams);
  };
  
  return {
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
  };
}
