import { useState, useRef, useEffect } from 'react';
import { Box, Button, Text, Flex, Image, Input, IconButton } from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { MdEdit, MdError } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useCustomStore } from '../../store/customStore';
import { useMatchStore } from '../../store/matchStore';
import { ScoreRules } from '../score/ScoreRules';
import type { ScoreRules as ScoreRulesType, TeamScore } from '../../types/score';
import type { Match } from '../../types/match';
import type { GeminiApiResponse } from '../../types/api';
import { analyzeImage } from '../../services/geminiService';

export const MatchDetail = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'teamName' | 'kills' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleTeams, setVisibleTeams] = useState<TeamScore[]>([]);
  const [displayTimerId, setDisplayTimerId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMatchId = useCustomStore((state) => state.currentMatchId);
  const currentCustomId = useCustomStore((state) => state.currentCustomId);
  const getMatchById = useMatchStore((state) => state.getMatchById);
  const updateMatch = useMatchStore((state) => state.updateMatch);
  const getCurrentCustom = useCustomStore((state) => state.getCurrentCustom);

  const currentMatch = currentMatchId ? getMatchById(currentMatchId) : undefined;
  const currentCustom = getCurrentCustom();
  

  if (!currentMatch || !currentCustom) {
    return null;
  }

  // 画像のドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // 画像アップロード処理
  const handleImageUpload = (file: File) => {
    // 画像ファイルのみ許可
    if (!file.type.match('image/png') && !file.type.match('image/jpeg')) {
      alert('PNG または JPEG 画像のみアップロードできます');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      
      // マッチ情報を更新
      if (currentMatch) {
        updateMatch({
          ...currentMatch,
          imageUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // ルールの保存
  const handleSaveRules = (rules: ScoreRulesType) => {
    if (currentMatch) {
      updateMatch({
        ...currentMatch,
        rules,
      });
    }
  };

  // スコア計算ロジック
  const calculateScores = (apiResponse: GeminiApiResponse[], rules: ScoreRulesType): TeamScore[] => {
    return apiResponse.map(team => {
      const teamId = `${currentCustom.id}_${team.team_name}`;
      
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
  
  // チーム情報の更新と再計算
  const updateTeamAndRecalculate = (teamId: string, field: 'teamName' | 'kills', value: string) => {
    if (!currentMatch) return;
    
    // 現在のチームデータをコピー
    const updatedTeams = [...currentMatch.teams];
    
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
      updatedTeam.killPoints = currentMatch.rules.killPointCap > 0 
        ? Math.min(kills, currentMatch.rules.killPointCap) 
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
    
    // マッチデータを更新
    updateMatch({
      ...currentMatch,
      teams: updatedTeams
    });
    
    // 手動修正後は段階的表示をクリアして即座に反映
    setVisibleTeams([]);
  };
  
  // 編集開始
  const handleStartEdit = (teamId: string, field: 'teamName' | 'kills') => {
    const team = currentMatch.teams.find(t => t.teamId === teamId);
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

  // タイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (displayTimerId !== null) {
        clearInterval(displayTimerId);
      }
    };
  }, [displayTimerId]);
  
  // 初期レンダリング時に集計結果がある場合はcalculationCompleteをtrueに設定
  useEffect(() => {
    if (currentMatch && currentMatch.teams && currentMatch.teams.length > 0) {
      setCalculationComplete(true);
    }
  }, [currentMatch?.teams?.length]);

  // 集計開始
  const handleStartCalculation = async () => {
    if (!currentMatch || !currentMatch.imageUrl) return;
    
    setIsCalculating(true);
    setError(null);
    setVisibleTeams([]); // 表示チームをリセット
    setCalculationComplete(false); // 再集計開始時にcalculationCompleteをfalseに設定
    
    // 前回のタイマーがあればクリア
    if (displayTimerId !== null) {
      clearInterval(displayTimerId);
      setDisplayTimerId(null);
    }
    
    try {
      // Gemini APIを呼び出して画像を解析
      const apiResponse = await analyzeImage(currentMatch.imageUrl);
      
      // 解析結果からスコアを計算
      const calculatedTeams = calculateScores(apiResponse, currentMatch.rules);
      
      // 計算結果をマッチに保存
      updateMatch({
        ...currentMatch,
        teams: calculatedTeams
      });
      
      // 段階的に表示
      // 順位でソートしたチームの配列を作成（昇順）
      const sortedTeams = [...calculatedTeams].sort((a, b) => a.placement - b.placement);
      console.log('Sorted teams:', sortedTeams); // デバッグ用
      
      // 段階的表示用の変数
      let displayedCount = 0;
      const totalTeams = sortedTeams.length;
      console.log('Total teams:', totalTeams); // デバッグ用
      
      // 表示間隔（ミリ秒）
      const interval = 150;
      
      // タイマーで段階的に表示
      const timerId = window.setInterval(() => {
        // 現在のインデックスが有効範囲内かチェック
        if (displayedCount < totalTeams) {
          const currentTeam = sortedTeams[displayedCount];
          console.log(`Adding team ${displayedCount + 1}:`, currentTeam); // デバッグ用
          
          // 現在のチームが存在する場合のみ処理
          if (currentTeam) {
            // 1チームずつ追加（順位順）
            setVisibleTeams(prev => {
              // 新しい配列を作成して返す（参照の問題を避けるため）
              const newTeams = [...prev];
              
              // まだ追加されていないチームのみを追加
              if (!newTeams.some(t => t?.teamId === currentTeam.teamId)) {
                newTeams.push(currentTeam);
                console.log('Updated visible teams:', newTeams); // デバッグ用
              }
              
              return newTeams;
            });
          }
          
          // カウントを増やす（チームの追加後）
          displayedCount++;
        } else {
          // 全チーム表示完了
          console.log('All teams displayed'); // デバッグ用
          clearInterval(timerId);
          setDisplayTimerId(null);
          setCalculationComplete(true);
        }
      }, interval);
      
      setDisplayTimerId(timerId);
      
    } catch (error) {
      console.error('画像解析エラー:', error);
      setError(error instanceof Error ? error.message : '画像の解析中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Box height="100%">
      <Box mb={6}>
        <ScoreRules initialRules={currentMatch.rules} onSave={handleSaveRules} />
      </Box>
      
      {/* 画像アップロード欄 - 横いっぱいに配置 */}
      {!currentMatch.imageUrl ? (
        <Box
          border="2px dashed"
          borderColor={isDragging ? 'blue.400' : 'gray.300'}
          borderRadius="md"
          p={10}
          textAlign="center"
          bg={isDragging ? 'blue.50' : 'gray.50'}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          mb={4}
          width="100%"
        >
          <Text color="gray.400" mb={4}>リザルト画面の画像をドラッグ＆ドロップ</Text>
          <Text color="gray.400" mb={4}>または</Text>
          <Button as="label" colorPalette="blue">
            ファイルを選択
            <input
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      ) : (
        <Box mb={4}>
          {/* 画像アップロード後のレイアウト - 左側に画像、右側に集計結果 */}
          <Flex gap={6} alignItems="flex-start">
            {/* 左側 - アップロード画像 */}
            <Box flex="1">
              <Text color="gray.950" fontSize="lg" fontWeight="bold" mb={3}>リザルト</Text>
              <Image 
                src={currentMatch.imageUrl} 
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
                onClick={handleStartCalculation} 
                loading={isCalculating}
                loadingText="解析中..."
                disabled={isCalculating || !currentMatch.imageUrl}
                mb={2}
              >
                {currentMatch.teams.length > 0 ? '再集計' : '集計開始'}
              </Button>
              {error && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  エラー: {error}
                </Text>
              )}
            </Box>
            
            {/* 右側 - 集計結果テーブル */}
            {currentMatch.teams.length > 0 && (
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
                    {/* 段階的表示中はvisibleTeamsを使用し、それ以外はcurrentMatch.teamsを使用 */}
                    {/* visibleTeamsは既にソート済みなのでソート不要 */}
                    {(visibleTeams.length > 0 ? visibleTeams : currentMatch.teams.sort((a, b) => a.placement - b.placement))
                      .map((team, index) => {
                        if (!team || !team.teamId) return null;
                        return (
                          <motion.tr
                            key={team.teamId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                              duration: 0.3,
                              delay: visibleTeams.length > 0 ? 0.05 * index : 0 // 段階的表示時のみディレイを適用
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
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
};
