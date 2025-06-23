export interface TeamScore {
  teamId: string;
  teamName: string;
  placement: number; // 順位
  kills: number;
  placementPoints: number; // 順位ポイント
  killPoints: number; // キルポイント
  totalPoints: number; // 合計ポイント
}

export interface ScoreRules {
  killPointCap: number; // キルポイント上限（0は無制限）
  placementPoints: number[]; // インデックスが順位-1、値がポイント
}
